const fs = require("fs");
const xlsx = require('xlsx');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const pdf = require('pdf-parse');
const PDFParser = require('pdf-parse');
const { Client } = require('@elastic/elasticsearch');
const JSZip = require('jszip');
const { parseString } = require('xml2js');


const elasticsearchClient = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'WOIF*Zz4brfMkMlIvyJQ'
  }
});



const path = require('path');

const convertTxtToJSON = (txtFilePath, jsonFilePath) => {
  // Retrieve the base filename without the directory path or extension
  const filename = path.basename(txtFilePath, path.extname(txtFilePath));

  fs.readFile(txtFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    // Split the text into lines and remove empty lines or lines with only whitespace
    const lines = data.split('\n').filter(line => line.trim());

    // Map each line to a JSON object including the filename
    const jsonArray = lines.map(line => {
      const [Name] = line.split(',');
    
      // Create the object, skipping empty names
      if (Name.trim()) {
        return { filename, Name: Name.trim() };
      }
      return null;
    }).filter(item => item !== null); // Filter out any null entries from the array

    // Convert the array of objects to JSON string
    const json = JSON.stringify(jsonArray, null, 2); // Pretty-print the JSON

    // Write JSON to file
    fs.writeFile(jsonFilePath, json, (err) => {
      if (err) {
        console.error("Error writing JSON file:", err);
        return;
      }
      console.log("Conversion completed. JSON file saved as:", jsonFilePath);
    });
  });
};

// Replace 'Doc.txt' and 'Doc.json' with your file paths
convertTxtToJSON("./Assets/Doc.txt", "Doc.json");
// Function to convert Excel file to JSON
const convertExcelToJSON = (excelFilePath, jsonFilePath) => {
  // Read Excel file
  const workbook = xlsx.readFile(excelFilePath);

  // Get the base filename without the directory path or extension
  const filename = path.basename(excelFilePath, path.extname(excelFilePath));

  // Convert first sheet to JSON
  const firstSheetName = workbook.SheetNames[0];
  let jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

  // Add filename to each entry in the JSON array
  jsonData = jsonData.map(entry => ({
    filename,
    ...entry
  }));

  // Write JSON to file
  fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), err => {
    if (err) {
      console.error("Error writing JSON file:", err);
      return;
    }
    console.log("Conversion completed. JSON file saved as:", jsonFilePath);
  });
};



// const pdfToText = async (pdfFilePath, textFilePath) => {
//   try {
//     const dataBuffer = fs.readFileSync(pdfFilePath);
//     const data = await PDFParser(dataBuffer);

//     // Extracted text from the PDF
//     const extractedText = data.text;

//     // Write the extracted text to a text file
//     fs.writeFileSync(textFilePath, extractedText, 'utf-8');
//     console.log(`Text has been written to ${textFilePath}`);
//   } catch (error) {
//     console.error('Error converting PDF to text:', error);
//   }
// };

// Read the file asynchronously with the correct encoding
// fs.readFile(filePath, 'utf8', (err, data) => {
//   if (err) {
//     console.error('Error reading the file:', err);
//     return;
//   }
//   // Output the Arabic text
//   console.log(data);
// });

// // Alternatively, you can read the file synchronously
// try {
//   const data = fs.readFileSync(filePath, 'utf8');
//   // Output the Arabic text
//   console.log('ar data' , data);
// } catch (err) {
//   console.error('Error reading the file:', err);
// }

const pdfToJSON = async (pdfFilePath, jsonFilePath) => {
  try {
    const dataBuffer = fs.readFileSync(pdfFilePath);
    const data = await PDFParser(dataBuffer);

    // Extracted text from the PDF
    const extractedText = data.text;

    // Split the text into lines
    const lines = extractedText.split('\n');

    // Get the folder name from the PDF file path
    const filename = path.basename(pdfFilePath, path.extname(pdfFilePath));

    // Convert the lines to a JSON array
    const jsonArray = lines
      .filter(line => line.trim() !== '') // Filter out empty lines after trimming
      .map((line, index) => ({
        id: index + 1, // Assign an ID to each non-empty line
        text: line.trim(),
        filename// Include the folder name in each JSON object
      }));

    // Convert the array of objects to JSON string
    const json = JSON.stringify(jsonArray, null, 2); // Pretty-print the JSON

    // Write JSON to file
    fs.writeFileSync(jsonFilePath, json, 'utf-8');
    console.log("Conversion completed. JSON file saved as:", jsonFilePath);
  } catch (error) {
    console.error('Error converting PDF to JSON:', error);
  }
};
// Replace 'input.pdf' and 'output.json' with your file paths




async function createIndex(indexName) {
  try {
    // Check if the index already exists
    const indexExists = await elasticsearchClient.indices.exists({ index: indexName });

    if (indexExists.body) {
      console.log(`Index "${indexName}" already exists.`);
    } else {
      // Create a new index
      const response = await elasticsearchClient.indices.create({ index: indexName });
      console.log(`Index "${indexName}" created:`, response.body);
    }
  } catch (error) {
    console.error('An error occurred while creating the index:', error);
  }
}
createIndex('my_index_5');



async function readJsonFile(filePath) {
  try {
    const fileContents = await readFileAsync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error reading file from disk: ${filePath}`, error);
    throw error; // Rethrow the error for the caller to handle
  }
}

async function bulkIndex(indexName, data) {
  try {
    const bulkBody = data.flatMap(doc => [{ index: { _index: indexName } }, doc]);
    console.log(bulkBody)
    // Perform the bulk indexing operation and destructure the response
    const { body } = await elasticsearchClient.bulk({ body: bulkBody, refresh: 'wait_for' });
    console.log(body)

    // Check if body is not undefined before attempting to access its properties
    if (body && body.errors) {
      console.log('Some operations failed during the bulk index:', body.errors);
      // Handle the detailed errors further from body.items array
    } else {
      console.log(`Successfully indexed ${data.length} items to index ${indexName}`);
    }
  } catch (error) {
    // If the Elasticsearch client throws an error, it will be caught here
    console.error('Error during bulk indexing:', error);
    // Re-throw the error to handle it in the main function or further up the call stack
    throw error;
  }
}

const convertPptxToJSON = async (pptxFile, jsonFilePath) => {
  try {
    const pptxBuffer = fs.readFileSync(pptxFile);
    const zip = new JSZip();
    const pptx = await zip.loadAsync(pptxBuffer);

    const slideFiles = Object.keys(pptx.files).filter(filename => filename.startsWith('ppt/slides/slide'));
    const slidesData = [];

    for (const slideFile of slideFiles) {
      const slideXML = await pptx.file(slideFile).async('text');
      parseString(slideXML, (err, result) => {
        if (err) {
          console.error('Error parsing slide XML:', err);
          return;
        }
        try {
          const textContentArray = result['p:sld']['p:cSld'][0]['p:spTree'][0]['p:sp'].map(sp => {
            if (sp['p:txBody']) {
              return sp['p:txBody'][0]['a:p'].map(p => {
                if (p['a:r'] && p['a:r'][0] && p['a:r'][0]['a:t']) {
                  return p['a:r'][0]['a:t'][0];
                } else {
                  return '';
                }
              }).join('');
            } else {
              return '';
            }
          });

          const textContent = textContentArray.join(' ');
          // Adding the slide filename to the slide data
          slidesData.push({ slide: slideFile.split('/').pop(), text: textContent }); // Adjusting the structure to include the filename
        } catch (error) {
          console.error('Error extracting text content:', error);
        }
      });
    }

    // Save the JSON to a file
    fs.writeFileSync(jsonFilePath, JSON.stringify(slidesData, null, 2), 'utf-8');
    console.log('Conversion completed. JSON file saved as:', jsonFilePath);
  } catch (error) {
    console.error('Error converting PowerPoint to JSON:', error);
  }
};


async function main() {
  // Replace 'myindex' with the name of your index
  const indexName = 'my_index_5';

  // Replace these file paths with the paths to your actual JSON files
  const docsJsonPath = './Doc.json';
  const excelJsonPath = './Excel.json';
  const excelJsonPath_2 = './excel_data_2.json';
  const arabicjsonpath = './arabic2.json'; 
  const arabic1jsonpath = './arabic1.json';
  const pptJsonpath = './Arabicppt.json';
  const pdf1Jsonpath = './Arabic2.json';
  const pdfJsonpath = './Arabic.json';

  try {
    // Read the JSON files and bulk index their contents
    const docsData = await readJsonFile(docsJsonPath);
    console.log(docsData)
    const excelData = await readJsonFile(excelJsonPath);
    const excelData_2 = await readJsonFile(excelJsonPath_2);
    const arabicData = await readJsonFile(arabicjsonpath);
    const pptData = await readJsonFile(pptJsonpath);
    const arabic1Data = await readJsonFile(arabic1jsonpath);
    const pdf1Data = await readJsonFile(pdf1Jsonpath);
    const pdfData = await readJsonFile(pdfJsonpath);

    console.log(excelData)

    await bulkIndex(indexName, pdf1Data);
    await bulkIndex(indexName, docsData);
    await bulkIndex(indexName, excelData);
    await bulkIndex(indexName, excelData_2);
    await bulkIndex(indexName, arabicData);
    await bulkIndex(indexName, pptData);
    await bulkIndex(indexName, arabic1Data);
    await bulkIndex(indexName, pdfData)

    // pdfToText('./Assets/arabic1.pdf', './arabic1.txt');
    convertExcelToJSON("./Assets/Excel.xlsx", "Excel.json");
    convertExcelToJSON("./Assets/excel_data_2.xlsx", "excel_data_2.json");
    convertTxtToJSON("./Assets/arabic1.txt", "./arabic1.json");
    pdfToJSON('./Assets/arabic1.pdf', './arabic.json');
    pdfToJSON('./Assets/arabic2.pdf', './arabic2.json');
    convertPptxToJSON('./Assets/Arabic.pptx', './Arabicppt.json');
  
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main().catch(console.error);
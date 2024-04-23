const fs = require("fs");
const PDFParser = require('pdf-parse');
const JSZip = require('jszip');
const { parseString } = require('xml2js');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
let path = require('path');
let xlsx = require('xlsx')

const pdfDir = path.join(__dirname, 'assets_pdf');
const resultpdfDir = path.join(__dirname, 'result_pdf');
const pptDir = path.join(__dirname, 'assets_ppt'); // Directory for PPT files
const textDir = path.join(__dirname, 'assets_txt'); // Directory for text files
const resultPptDir = path.join(__dirname, 'result_ppt'); // Directory for PPT results
const resultTextDir = path.join(__dirname, 'result_txt');
const excelDir = path.join(__dirname,'assets_excel');
const resultExcelDir = path.join(__dirname,'result_excel');


const pdfToJSON = async (pdfFilePath, jsonFilePath) => {
    try {
        const dataBuffer = fs.readFileSync(pdfFilePath);
        const data = await PDFParser(dataBuffer);
        const elasticUsername = 'elastic'; // elasticsearchClient.options.auth.username;
        const extractedText = data.text;
        const combinedText = extractedText
            .split('\n')
            .filter(line => line.trim() !== '') // Filter out empty lines after trimming
            .join(' '); // Join lines into a single string

        const fileExtension = path.extname(pdfFilePath).replace('.', ''); // Remove the dot from the extension

        const jsonObject = [{
            elastic_index: "my_index_101",
            title: "Index data with Elastic",
            author_name: 'elastic',
            user_id: "",
            date_inserted: new Date().toISOString(),
            file_type: "pdf",
            file_extension: fileExtension, // Use the extracted file extension
            file_content: combinedText,
            last_updated_file: new Date().toISOString()
        }];
        //   {
        //     "elastic_index":""
        //       "title": "Index data with Elastic",
        //       "category": "User Stories",
        //       "author_name": "",
        //       "userid":"elastic search user"
        //       "created_at":datetimne
        //       "orignal_file_name:"abc",
        //       "file_type:"pdf"
        //       "file_extension":"xsl"
        //       "file_content":"this is file content",
        //      last_updated file: , 
        //      file_downloaded : elastic , 
        //      key_word: '' 
        //      }  
        const json = JSON.stringify(jsonObject, null, 2); // Pretty-print the JSON
        console.log(jsonObject);
        fs.writeFileSync(jsonFilePath, json, 'utf-8');
        console.log("Conversion completed. JSON file saved as:", jsonFilePath);
    } catch (error) {
        console.error('Error converting PDF to JSON:', error);
    }
};

const pptToJSON = async (pptxFilePath, jsonFilePath) => {
    try {
        const pptxBuffer = fs.readFileSync(pptxFilePath);
        const zip = new JSZip();
        const pptx = await zip.loadAsync(pptxBuffer);
        const slideFiles = Object.keys(pptx.files).filter(filename => filename.startsWith('ppt/slides/slide'));

        let combinedText = "";
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
                            }).join(' ');
                        } else {
                            return '';
                        }
                    });
                    combinedText += textContentArray.join(' ') + ' '; // Concatenate slide text
                } catch (error) {
                    console.error('Error extracting text content:', error);
                }
            });
        }

        const fileExtension = path.extname(pptxFilePath).replace('.', '');

        const jsonObject = {
            elastic_index: "my_index_101",
            title: "Index data with Elastic",
            author_name: 'elastic',
            user_id: "",
            date_inserted: new Date().toISOString(),
            file_type: "ppt",
            file_extension: fileExtension,
            file_content: combinedText.trim(),
            last_updated_file: new Date().toISOString()
        };

        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObject, null, 2), 'utf-8');
        console.log('Conversion completed. JSON file saved as:', jsonFilePath);
    } catch (error) {
        console.error('Error converting PowerPoint to JSON:', error);
    }
};

const textToJSON = (txtFilePath, jsonFilePath) => {
    fs.readFile(txtFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return;
        }

        const fileExtension = path.extname(txtFilePath).replace('.', '');

        const combinedText = data.split('\n').filter(line => line.trim() !== '').join(' ');

        const jsonObject = {
            elastic_index: "my_index_101",
            title: "Index data with Elastic",
            author_name: 'elastic',
            user_id: "",
            date_inserted: new Date().toISOString(),
            file_type: "text",
            file_extension: fileExtension,
            file_content: combinedText,
            last_updated_file: new Date().toISOString()
        };

        fs.writeFile(jsonFilePath, JSON.stringify(jsonObject, null, 2), (err) => {
            if (err) {
                console.error("Error writing JSON file:", err);
                return;
            }
            console.log("Conversion completed. JSON file saved as:", jsonFilePath);
        });
    });
};

const excelToJSON = (excelFilePath, jsonFilePath) => {
    try {
        // Load the Excel file
        const workbook = xlsx.readFile(excelFilePath);
        // Assuming data is in the first sheet
        const sheetName = workbook.SheetNames[0];
        // Convert the sheet data to JSON
        const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        // Combine all rows into a single string, assuming each row is an object
        const combinedText = sheetData.map(row => {
            // Convert each row object to string and join with a space
            return Object.values(row).join(' ');
        }).join(' ');

        const fileExtension = path.extname(excelFilePath).replace('.', ''); // Remove the dot from the extension

        // Construct the JSON object
        const jsonObject = {
            elastic_index: "my_index_101",
            title: "Index data with Elastic",
            author_name: 'elastic',
            user_id: "",
            date_inserted: new Date().toISOString(),
            file_type: "excel",
            file_extension: fileExtension,
            file_content: combinedText,
            last_updated_file: new Date().toISOString()
        };

        // Write the JSON to a file
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObject, null, 2), 'utf-8');
        console.log('Conversion completed. JSON file saved as:', jsonFilePath);
    } catch (error) {
        console.error('Error converting Excel to JSON:', error);
    }
};

const fileToJSON = async (filePath, jsonFilePath) => {
    const fileExtension = path.extname(filePath).toLowerCase();
    switch (fileExtension) {
        case '.pdf':
            await pdfToJSON(filePath, jsonFilePath);
            break;
        case '.txt':
            await textToJSON(filePath, jsonFilePath);
            break;
        case '.pptx': // Assuming .ppt is the extension for PowerPoint files
            await pptToJSON(filePath, jsonFilePath);
            break;
        case '.xlsx':
            await excelToJSON(filePath, jsonFilePathn);
            break;
        default:
            throw new Error(`Unsupported file type: ${fileExtension}`);
    }
};
async function processFiles(directory, resultDirectory, extension, conversionFunction) {
    try {
        const files = await fs.promises.readdir(directory);
        const targetFiles = files.filter(file => file.toLowerCase().endsWith(extension));

        if (targetFiles.length === 0) {
            console.log(`No ${extension} files found.`);
            return;
        }
        for (const file of targetFiles) {
            const filePath = path.join(directory, file);
            const jsonFileName = path.basename(file, extension) + '.json';
            const jsonFilePath = path.join(resultDirectory, jsonFileName);

            console.log(`Processing ${file}...`);
            await conversionFunction(filePath, jsonFilePath);
            console.log(`Processed ${file} successfully.`);
        }
    } catch (error) {
        console.error(`Error processing ${extension} files:`, error);
    }
}
// Example run function to convert a specific file
async function runConversion() {

    try {
        await processFiles(pdfDir, resultpdfDir, '.pdf', pdfToJSON); // Process PDF files
        await processFiles(textDir, resultTextDir, '.txt', textToJSON); // Process text files
        await processFiles(pptDir, resultPptDir, '.pptx', pptToJSON); // Process PPT files
        await processFiles(excelDir, resultExcelDir, '.xlsx', excelToJSON); // Process Excel files
        console.log('All Conversion successful');
    } catch (error) {
        console.error('Conversion failed:', error);
    }
}

runConversion();
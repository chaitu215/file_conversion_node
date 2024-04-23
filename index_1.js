const fs = require("fs");
const PDFParser = require('pdf-parse');
const JSZip = require('jszip');
const { parseString } = require('xml2js');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
let path = require('path');

const assetDir = path.join(__dirname, 'assets_pdf');
const resultDir = path.join(__dirname, 'result_pdf');

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

async function processRandomPDF() {
    try {
        const files = await fs.promises.readdir(assetDir);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        if (pdfFiles.length === 0) {
            console.log("No PDF files found.");
            return;
        }
        for (const file of pdfFiles) {
            const pdfFilePath = path.join(assetDir, file);
            const jsonFileName = path.basename(file, '.pdf') + '.json';
            const jsonFilePath = path.join(resultDir, jsonFileName);

            console.log(`Processing ${file}...`);
            await pdfToJSON(pdfFilePath, jsonFilePath);
            console.log(`Processed ${file} successfully.`);
        }
    } catch (error) {
        console.error('Error processing PDF file:', error);
    }
}
// Example run function to convert a specific file
async function runConversion() {

    try {
        await processRandomPDF();
        // await pdfToJSON(pdfFilePath, jsonFilePath);
        console.log('All Conversion successful');
    } catch (error) {
        console.error('Conversion failed:', error);
    }
}

runConversion();
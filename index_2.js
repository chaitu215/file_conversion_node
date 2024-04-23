// const fs = require("fs");
// const xlsx = require('xlsx');
// const { promisify } = require('util');
// const readFileAsync = promisify(fs.readFile);
// const pdf = require('pdf-parse');
// const PDFParser = require('pdf-parse');
// const { Client } = require('@elastic/elasticsearch');
// const JSZip = require('jszip');
// const { parseString } = require('xml2js');
// const readdir = promisify(fs.readdir);
// const readFile = promisify(fs.readFile);
// let path = require('path');

// let resultDir = path.join(__dirname,'result_pdf');

// const elasticsearchClient = new Client({
//   node: 'http://localhost:9200',
//   auth: {
//     username: 'elastic',
//     password: 'WOIF*Zz4brfMkMlIvyJQ' //'P_0re-e8+cCS_yPk9Jst' // 
//   }
// });

// async function deleteIndexIfExists(indexName) {
//     const { body: exists } = await elasticsearchClient.indices.exists({ index: indexName });
//     if (exists) {
//       const { body: deleteResponse } = await elasticsearchClient.indices.delete({ index: indexName });
//       console.log(`Index ${indexName} deleted:`, deleteResponse);
//     }
// }

// async function bulkIndex(indexName, data) {
//   try {
    
//     await deleteIndexIfExists(indexName);

//     const bulkBody = data.flatMap(doc => [{ index: { _index: indexName } }, doc]);
//     console.log(bulkBody)
//     // Perform the bulk indexing operation and destructure the response
//     const { body } = await elasticsearchClient.bulk({ body: bulkBody, refresh: 'wait_for' });
//     // Check if body is not undefined before attempting to access its properties
//     if (body && body.errors) {
//       console.log('Some operations failed during the bulk index:', body.errors);
//       // Handle the detailed errors further from body.items array
//     } else {
//       console.log(`Successfully indexed ${data.length} items to index ${indexName}`);
//     }
//   } catch (error) {
//     // If the Elasticsearch client throws an error, it will be caught here
//     console.error('Error during bulk indexing:', error);
//     // Re-throw the error to handle it in the main function or further up the call stack
//     throw error;
//   }
// }


// async function main() {
//   const indexName = 'my_index_101';
// //   const arabicjsonpath = './arabic2.json'; 
// //   const pptJsonpath = 'output.json'

//   try {

//     // const arabicData = await readJsonFile(arabicjsonpath);
   
//     // const pptData = await readJsonFile(pptJsonpath);

//     // pdfToJSON('./assets_pdf/arabic_1.pdf', './arabic2.json');

//     await deleteIndexIfExists(indexName);
//     await bulkIndex(indexName, resultDir);
 
    
//   } catch (error) {
//     console.error('An error occurred:', error);
//   }
// }

// main().catch(console.error);

const fs = require("fs");
const path = require('path');
const { promisify } = require('util');
const { Client } = require('@elastic/elasticsearch');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const resultDir = path.join(__dirname, 'result_pdf');
const elasticsearchClient = new Client({
  node: 'http://localhost:9200',
  auth: {
    username: 'elastic',
    password: 'WOIF*Zz4brfMkMlIvyJQ' // Replace 'YOUR_PASSWORD' with your actual password, and secure it properly.
  }
});


async function bulkIndex(indexName, documents) {
    try {
      const bulkBody = documents.flatMap((doc) => [{ index: { _index: indexName } }, doc]);
  
      // Make the bulk request to Elasticsearch
      const { body } = await elasticsearchClient.bulk({ body: bulkBody, refresh: 'wait_for' });
  
      if (body) {
        // If there are errors, they will be detailed in the 'items' array
        console.error('Bulk indexing errors:', body.items);
      } else {
        console.log(`Successfully indexed ${documents.length} documents to index ${indexName}.`);
      }
    } catch (error) {
      console.error('Error during bulk indexing:', error);
      throw error;
    }
  }

async function readFilesAndIndex(indexName) {
  try {
    const files = await readdir(resultDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    let documents = [];

    for (let file of jsonFiles) {
      const filePath = path.join(resultDir, file);
      const content = await readFile(filePath, 'utf8');
      documents.push(JSON.parse(content)); // Adjusted to push parsed JSON directly
    }

    if (documents.length > 0) {
      await bulkIndex(indexName, documents.flat()); // Use flat to handle arrays of arrays
    } else {
      console.log('No documents to index.');
    }
  } catch (error) {
    console.error('Error processing files:', error);
    throw error;
  }
}

async function main() {
  const indexName = 'my_index_101';
  await readFilesAndIndex(indexName);
}

main().catch(console.error);
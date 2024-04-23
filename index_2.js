const fs = require("fs");
const path = require('path');
const { promisify } = require('util');
const { Client } = require('@elastic/elasticsearch');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const resultPdfDir = path.join(__dirname, 'result_pdf');
const resultPptDir = path.join(__dirname, 'result_ppt');
const resultTxtDir = path.join(__dirname, 'result_txt');
const resultExcelDir = path.join(__dirname, 'result_excel');

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

async function readFilesAndIndex(indexName,resultDir) {
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
  await readFilesAndIndex(indexName,resultPdfDir);
  await readFilesAndIndex(indexName,resultPptDir);
  await readFilesAndIndex(indexName,resultTxtDir);
  await readFilesAndIndex(indexName,resultExcelDir);
}

main().catch(console.error);
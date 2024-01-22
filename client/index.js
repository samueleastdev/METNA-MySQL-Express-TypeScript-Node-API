const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-extra');
const path = require('path');

const serverUrl = 'http://localhost:8080';
const localFolderPath = '/Users/samueleast/Desktop/test';
const uploadRecordFile = './uploadRecords.json';

// Parse command-line arguments
function parseArguments() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.split('=');
    if (key === '-u') args.username = value;
    else if (key === '-p') args.password = value;
  });
  return args;
}

// Ensure required arguments are provided
function validateArguments(args) {
  if (!args.username || !args.password) {
    throw new Error("Username and password must be provided.");
  }
}

// Get last upload times from record file
async function getLastUploadTimes() {
  return fs.existsSync(uploadRecordFile) ? fs.readJson(uploadRecordFile) : {};
}

// Update last upload time in record file
async function updateLastUploadTime(fileName, timestamp) {
  const records = await getLastUploadTimes();
  records[fileName] = timestamp;
  await fs.writeJson(uploadRecordFile, records);
}

// Authenticate and get access token
async function getAccessToken(username, password) {
  const response = await axios.post(`${serverUrl}/api/auth/signin`, { username, password });
  return response.data.accessToken;
}

// Upload file to server
async function uploadFile(filePath, accessToken) {
  const fileName = path.basename(filePath);
  const fileStats = await fs.stat(filePath);
  const lastModified = fileStats.mtime.getTime();
  const lastUploadTimes = await getLastUploadTimes();

  if (lastUploadTimes[fileName] === lastModified) {
    console.log(`Skipping unmodified file: ${fileName}`);
    return;
  }

  const presignedUrl = await getPresignedUrl(accessToken, fileName);
  await uploadToPresignedUrl(presignedUrl, filePath);
  await updateLastUploadTime(fileName, lastModified);
  console.log(`File uploaded successfully: ${fileName}`);
}

// Get AWS presigned URL for uploading
async function getPresignedUrl(accessToken, fileName) {
  const response = await axios.get(`${serverUrl}/api/aws/generate-presigned-url`, {
    headers: { 'x-access-token': accessToken },
    params: { filename: fileName }
  });
  return response.data;
}

// Upload file to AWS using the presigned URL
async function uploadToPresignedUrl(presignedUrl, filePath) {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));

  const config = {
    headers: formData.getHeaders(),
    onUploadProgress: progressEvent => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`${filePath}: Upload Progress ${percentCompleted}%`);
    }
  };

  await axios.put(presignedUrl, formData, config);
}

// Main execution function
async function main() {
  try {
    const { username, password } = parseArguments();
    validateArguments({ username, password });

    const accessToken = await getAccessToken(username, password);
    if (!accessToken) throw new Error('Failed to get access token.');

    const files = await fs.readdir(localFolderPath);
    for (const file of files) {
      const filePath = path.join(localFolderPath, file);
      await uploadFile(filePath, accessToken);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

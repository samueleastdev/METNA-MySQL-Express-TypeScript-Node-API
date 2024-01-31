const fs = require('fs-extra');
const path = require('path');

const uploadRecordFile = './sync.json';

function checkFileExists(filename) {
  try {
    fs.accessSync(filename);
    return true;
  } catch (err) {
    return false;
  }
}

async function getLastUploadTimes() {
  return fs.existsSync(uploadRecordFile) ? fs.readJson(uploadRecordFile) : {};
}

async function updateLastUploadTime(fileName, timestamp) {
  const records = await getLastUploadTimes();
  records[fileName] = timestamp;
  await fs.writeJson(uploadRecordFile, records);
}

async function readUploadRecords() {
  try {
    if (fs.existsSync(uploadRecordFile)) {
      return fs.readJson(uploadRecordFile);
    } else {
      console.log('No upload records found.');
      return {};
    }
  } catch (error) {
    console.error('Error reading upload records:', error);
    return {};
  }
}

function getAllFiles(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

module.exports = { checkFileExists, getLastUploadTimes, updateLastUploadTime, readUploadRecords, getAllFiles };

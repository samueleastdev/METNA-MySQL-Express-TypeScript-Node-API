const fs = require('fs-extra');
const mime = require('mime-types');

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function getSubdirectoryPath(fullFilePath, localPath) {
  if (fullFilePath.startsWith(localPath)) {
    return fullFilePath.substring(localPath.length).substring(1);
  } else {
    throw new Error("The full file path does not start with the base path.");
  }
}

function readKeyValuePairsFromFile(filePath) {
  try {

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const keyValuePairs = {};

    for (const line of lines) {
      const parts = line.trim().split('=');
      if (parts.length === 2) {
        const key = parts[0].trim();
        const value = parts[1].trim();
        keyValuePairs[key] = value;
      }
    }

    return keyValuePairs;
  } catch (error) {
    console.error('Error reading the file:', error);
    return null;
  }
}

function getMimeType(filePath) {
  const mimeType = mime.lookup(filePath);
  return mimeType || 'application/octet-stream'; // Fallback to a default
}

module.exports = { formatBytes, getSubdirectoryPath, readKeyValuePairsFromFile, getMimeType };
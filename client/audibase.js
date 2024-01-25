#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const { checkFileExists, getLastUploadTimes, updateLastUploadTime, readUploadRecords } = require('./fileUtils');
const { getEmail, getPassword, getRemotePath, getDestination } = require('./inputUtils');
const { getAccessToken, validateRequest, getPresignedUrl, getS3Urls, uploadComplete } = require('./serverUtils');
const { formatBytes, getSubdirectoryPath, readKeyValuePairsFromFile, getMimeType } = require('./helperUtils');

let email, password, localPath = process.cwd(), remote, trackId;

async function uploadFile(filePath) {
  const s3Key = getSubdirectoryPath(filePath, localPath);
  const fileStats = await fs.stat(filePath);
  const lastModified = fileStats.mtime.getTime();
  const lastUploadTimes = await getLastUploadTimes();

  if (lastUploadTimes[s3Key] === lastModified) {
    console.log(`Skipping unmodified file: ${s3Key}`);
    return;
  }

  const presignedUrl = await getPresignedUrl(`${remote}/${s3Key}`);
  await uploadToPresignedUrl(presignedUrl, filePath);
  await updateLastUploadTime(s3Key, lastModified);
}

async function uploadToPresignedUrl(presignedUrl, filePath) {
  const { size } = await fs.stat(filePath);
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);

  console.log(`Uploading... ${fileName}:${getMimeType(fileName)} with size ${formatBytes(size)} bytes.`);

  const response = await axios.put(presignedUrl, fileStream, {
    headers: {
      'Content-Type': getMimeType(fileName),
      'Content-Length': size
    }
  });

  return response;
}

async function processDirectory(directoryPath) {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  for (const dirent of entries) {
    const entryPath = path.join(directoryPath, dirent.name);

    if (dirent.isFile()) {
      await uploadFile(entryPath);
    } else if (dirent.isDirectory()) {
      await processDirectory(entryPath);
    }
  }
}

async function initializeFromAudibaseFile() {
  const keyValuePairs = readKeyValuePairsFromFile('.audibase');
  if (!keyValuePairs) throw new Error('Failed to read key-value pairs from Audibase file.');
  ({ email, remote, network, trackId } = keyValuePairs);
  network = await getDestination();
  password = await getPassword();
  await getAccessToken(email, password);
}

async function initializeFromUserInput() {
  network = await getDestination();
  remote = await getRemotePath();
  email = await getEmail();
  password = await getPassword();
  await getAccessToken(email, password);

  const track = await validateRequest(remote);
  trackId = track.id;

  const fileContent = `email=${email}\nnetwork=${network}\nremote=${remote}\ntrackId=${track.id}\n`;
  fs.writeFileSync('.audibase', fileContent);
}

async function downloadFiles(tracks, localFolder) {
  for (const track of tracks) {
    try {
      const url = track.url;
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
      });

      const localFilePath = path.resolve(localFolder, path.basename(track.key));
      const writer = fs.createWriteStream(localFilePath);

      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`Downloaded ${track.key} to ${localFilePath}`);
    } catch (error) {
      console.error(`Error downloading ${track.key}: ${error.message}`);
    }
  }
}

async function main() {
  try {
    const audibaseFileExists = checkFileExists('.audibase');
    if (audibaseFileExists) {
      await initializeFromAudibaseFile();
    } else {
      await initializeFromUserInput();
    }

    if (network === 'pull') {
      const getTracks = await getS3Urls(remote);
      console.log('getTracks', getTracks);
      await downloadFiles(getTracks, localPath);
      console.log('Successfully download...');
      process.exit(1);
    }
    if (network === 'push') {
      await processDirectory(localPath);
      const uploadRecords = await readUploadRecords();
      await uploadComplete(uploadRecords, trackId);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

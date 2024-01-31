#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const { checkFileExists, readUploadRecords, getAllFiles } = require('./fileUtils');
const { getLogoutData, getLoginData } = require('./inputUtils');
const { getAccessToken, validateRequest, getPresignedUrl, getS3Urls, uploadComplete } = require('./serverUtils');
const { formatBytes, readKeyValuePairsFromFile, getMimeType } = require('./helperUtils');

let email, localPath = process.cwd(), remote, option, trackId;

async function uploadToPresignedUrl(presignedUrl, filePath) {
  const { size } = await fs.stat(filePath);
  const fileName = path.basename(filePath);
  const fileStream = fs.createReadStream(filePath);

  console.log('\x1b[36m%s\x1b[0m', `Uploading... ${fileName}:${getMimeType(fileName)} with size ${formatBytes(size)} bytes.`);

  const response = await axios.put(presignedUrl, fileStream, {
    headers: {
      'Content-Type': getMimeType(fileName),
      'Content-Length': size
    }
  });

  return response;
}

async function initializeFromAudibaseFile() {
  const keyValuePairs = readKeyValuePairsFromFile('.audibase');
  if (!keyValuePairs) throw new Error('Failed to read key-value pairs from Audibase file.');
  ({ email, remote, trackId } = keyValuePairs);
  const data = await getLoginData();
  option = data.option;
  await getAccessToken(email, data.password);
}

async function initializeFromUserInput() {
  const data = await getLogoutData();
  option = data.option;
  remote = data.remote;
  await getAccessToken(data.email, data.password);

  const track = await validateRequest(remote);
  trackId = track.id;

  const fileContent = `email=${data.email}\nremote=${remote}\ntrackId=${track.id}\n`;
  fs.writeFileSync('.audibase', fileContent);
}


async function main() {
  try {
    const audibaseFileExists = checkFileExists('.audibase');
    if (audibaseFileExists) {
      await initializeFromAudibaseFile();
    } else {
      await initializeFromUserInput();
    }

    let syncData, message;

    try {
      syncData = JSON.parse(fs.readFileSync('./sync.json', 'utf8'));
    } catch (error) {
      console.warn('Sync file not found or invalid, initializing new sync data.');
      syncData = {};
    }

    const localFiles = getAllFiles(localPath);
    const remoteFiles = await getS3Urls(remote);

    if (option === 'pull') {

      for (const remoteFile of remoteFiles) {
        const remoteFilePath = remoteFile.key;
        const localFilePath = path.join(localPath, remoteFile.basePath);


        if (path.basename(remoteFilePath) === '.DS_Store') {
          continue;
        }

        const fileExistsLocally = localFiles.includes(localFilePath);
        const remoteFileLastModified = new Date();

        if (!fileExistsLocally || (syncData[remoteFilePath] && new Date(syncData[remoteFilePath].lastModified) < remoteFileLastModified)) {
          const downloadUrl = remoteFile.url;
          const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });

          fs.mkdirSync(path.dirname(localFilePath), { recursive: true });
          fs.writeFileSync(localFilePath, response.data);
          syncData[remoteFilePath] = { lastModified: remoteFileLastModified.toISOString(), location: 'remote' };
        }
      }

      for (const fileName in syncData) {
        if (!remoteFiles.map(file => file.basePath).includes(fileName)) {
          const localFilePath = path.join(localPath, fileName);
          if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
          }
          delete syncData[fileName];
          console.log('\x1b[31m%s\x1b[0m', `Deleted... ${syncData[fileName]}`);
        }
      }

      message = 'Successfully synced remote to local';

    }
    if (option === 'push') {

      // Local to remote sync
      for (const filePath of localFiles) {
        const relativePath = path.relative(localPath, filePath);

        if (path.basename(filePath) === '.DS_Store') {
          continue;
        }

        const fileStats = fs.statSync(filePath);
        if (!syncData[relativePath] || syncData[relativePath].lastModified < fileStats.mtime.toISOString()) {
          const presignedUrl = await getPresignedUrl(`${remote}/${relativePath}`, 'upload');
          await uploadToPresignedUrl(presignedUrl, filePath);
          syncData[relativePath] = { lastModified: fileStats.mtime.toISOString(), location: 'local' };
        }
      }

      // Delete files from S3 if they are deleted locally
      for (const fileName in syncData) {
        if (!localFiles.includes(path.join(localPath, fileName))) {
          const deleteUrl = await getPresignedUrl(`${remote}/${fileName}`, 'delete');
          await axios.delete(deleteUrl);
          delete syncData[fileName];
          console.log('\x1b[31m%s\x1b[0m', `Deleted... ${syncData[fileName]}`);
        }
      }

      message = 'Successfully synced local to remote';

    }

    fs.writeFileSync('./sync.json', JSON.stringify(syncData, null, 2));

    await uploadComplete(syncData, trackId);

    console.log('\x1b[36m%s\x1b[0m', message);
    process.exit(1);

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `Error: ${error.message}`);
    process.exit(1);
  }
}

main();

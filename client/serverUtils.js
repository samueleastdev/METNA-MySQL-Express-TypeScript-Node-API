const axios = require('axios');
const path = require('path');

const serverUrl = 'http://localhost:8080';

let accessToken;

async function getAccessToken(email, password) {
  const response = await axios.post(`${serverUrl}/api/auth/signin`, { email, password });
  if (!response.data.accessToken) throw new Error('Failed to get access token.');
  accessToken = response.data.accessToken;
  return;
}

async function validateRequest(remotePath) {
  const response = await axios.get(`${serverUrl}/api/aws/validate-request`, {
    headers: { 'x-access-token': accessToken },
    params: {
      folder: remotePath
    }
  });
  return response.data;
}

async function getPresignedUrl(fileName, action) {
  console.log('action', action);
  const response = await axios.get(`${serverUrl}/api/aws/generate-presigned-url`, {
    headers: { 'x-access-token': accessToken },
    params: {
      filename: fileName,
      operation: action
    }
  });
  return response.data;
}

async function getS3Urls(remote) {
  const response = await axios.get(`${serverUrl}/api/aws/get-s3-urls`, {
    headers: { 'x-access-token': accessToken },
    params: {
      folder: remote
    }
  });
  return response.data;
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

async function uploadComplete(uploadRecords, trackId) {
  try {
    await axios.put(`${serverUrl}/api/track`, {
      trackId,
      files: uploadRecords
    }, {
      headers: { 'x-access-token': accessToken }
    });
    return true;
  } catch (error) {
    console.error(`Error `, error.message);
  }
}


module.exports = { getAccessToken, validateRequest, getPresignedUrl, getS3Urls, downloadFiles, uploadComplete };

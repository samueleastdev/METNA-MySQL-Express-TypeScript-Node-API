const axios = require('axios');

const serverUrl = 'http://localhost:8080';

let accessToken;

async function getAccessToken(email, password) {
  const response = await axios.post(`${serverUrl}/api/auth/signin`, { email, password });
  if (!response.data.accessToken) throw new Error('Failed to get access token.');
  accessToken = response.data.accessToken;
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

async function getPresignedUrl(fileName) {
  const response = await axios.get(`${serverUrl}/api/aws/generate-presigned-url`, {
    headers: { 'x-access-token': accessToken },
    params: {
      filename: fileName
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

async function uploadComplete(uploadRecords, trackId) {

  await axios.get(`${serverUrl}/api/track`, {
    headers: { 'x-access-token': accessToken },
    params: {
      trackId,
      files: uploadRecords
    }
  });
  console.log('Successfully uploaded...');
  process.exit(1);
}

module.exports = { getAccessToken, validateRequest, getPresignedUrl, getS3Urls, uploadComplete };

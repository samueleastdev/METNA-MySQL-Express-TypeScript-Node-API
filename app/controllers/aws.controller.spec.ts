import { Request, Response } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { generatePresignedDeleteUrl } from './aws.controller';

const s3Client = new S3Client({});
const s3Mock = mockClient(s3Client);

console.log = jest.fn();
console.error = jest.fn();

function createMockRequestResponse(queryParams = {}) {
  const req = {
    query: queryParams,
    userId: 1,
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  } as unknown as Response;

  return { req, res };
}

describe('generatePresignedUrl', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it('generates a presigned delete URL for a valid request', async () => {
    const { req, res } = createMockRequestResponse({ filename: 'test.txt' });

    await generatePresignedDeleteUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining('test.txt'));
  });

  it('returns a 400 status when no filename is provided', async () => {
    const { req, res } = createMockRequestResponse();

    await generatePresignedDeleteUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      error: 'Missing required parameters. Please include filename.',
    });
  });

  it('returns a 500 status when query parameters are missing', async () => {
    const { req, res } = createMockRequestResponse();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req.query as any) = undefined;

    await generatePresignedDeleteUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: 'An error occurred while generating presigned URL.',
    });
  });
});

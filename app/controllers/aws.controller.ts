import { Request, Response } from 'express';
import Logger from '../logging';
import db from '../models';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Ensure environment variables are set
const awsRegion = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!awsRegion || !accessKeyId || !secretAccessKey) {
  throw new Error('AWS credentials or region not set in environment variables');
}

const s3Client = new S3Client({
  region: awsRegion,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

export const generatePresignedUrl = async (req: Request, res: Response) => {
  const logger = Logger.getInstance();
  logger.info(JSON.stringify(req.query.filename));
  logger.info(JSON.stringify(req.userId));
  try {
    const key = `${req.userId}/${req.query.filename}`;
    const params = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, params, { expiresIn: 600 });

    res.status(200).send(url);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: 'An error occurred while generating presigned URL.',
    });
  }
};

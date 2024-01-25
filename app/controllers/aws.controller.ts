import { Request, Response } from 'express';
import Logger from '../logging';
import db from '../models';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  UploadPartCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
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

const Track = db.track;

export const startUpload = async (req: Request, res: Response) => {
  try {
    //const key = `${req.userId}/${req.query.filename}`;
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: req.query.fileName as string,
      ContentType: req.query.fileType as string,
    };

    console.log('startUpload', params);

    const command = new CreateMultipartUploadCommand(params);
    const uploadData = await s3Client.send(command);
    res.send({ uploadId: uploadData.UploadId });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const fileName = req.query.fileName as string;
    const partNumber = parseInt(req.query.partNumber as string, 10);
    const uploadId = req.query.uploadId as string;

    if (!fileName || !uploadId) {
      res.status(400).send('Missing required query parameters');
      return;
    }

    const command = new UploadPartCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      PartNumber: partNumber,
      UploadId: uploadId,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // Time in seconds, e.g., 3600 for 1 hour
    });

    res.send({ presignedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

export const completeUpload = async (req: Request, res: Response) => {
  try {
    // Assuming the body has the structure: { params: { fileName, parts, uploadId } }
    const { fileName, parts, uploadId } = req.body.params;

    if (!fileName || !parts || !uploadId) {
      res.status(400).send('Missing required parameters in body');
      return;
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      MultipartUpload: {
        Parts: parts,
      },
      UploadId: uploadId,
    };

    const command = new CompleteMultipartUploadCommand(params);
    const data = await s3Client.send(command);

    res.send({ data });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
};

export const generatePresignedUrl = async (req: Request, res: Response) => {
  const logger = Logger.getInstance();
  try {
    const key = `${req.userId}/${req.query.filename}`;
    logger.info(key);
    const params = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, params, { expiresIn: 3600 });

    res.status(200).send(url);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: 'An error occurred while generating presigned URL.',
    });
  }
};

export const getS3Urls = async (req: Request, res: Response) => {
  const logger = Logger.getInstance();
  try {
    const folderKey = `${req.userId}/${req.query.folder}/`; // Ensure the trailing slash for the folder
    const listParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: folderKey,
    };

    const listCommand = new ListObjectsV2Command(listParams);
    const objectsList = await s3Client.send(listCommand);

    if (!objectsList.Contents || objectsList.Contents.length === 0) {
      return res.status(200).send({ message: 'No files found in the specified folder.' });
    }

    const urls = await Promise.all(
      objectsList.Contents.map(async (object) => {
        const urlParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: object.Key,
        };

        const url = await getSignedUrl(s3Client, new GetObjectCommand(urlParams), {
          expiresIn: 3600,
        });
        return { key: object.Key, url };
      }),
    );

    res.status(200).send(urls);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: 'An error occurred while generating presigned URLs.',
    });
  }
};

export const validateRequest = async (req: Request, res: Response) => {
  const logger = Logger.getInstance();
  try {
    const key = `${req.userId}/${req.query.folder}/.audibase`;

    // Check if the file exists on S3
    const headObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    // Use the headObject method to check if the object exists
    await s3Client.send(new HeadObjectCommand(headObjectParams));

    // If the object exists, it will resolve successfully

    // Check db
    const track = await Track.findOne({
      where: {
        sanitizedName: req.query.folder,
        userId: req.userId,
      },
    });

    if (track) {
      res.status(200).send(track);
    } else {
      res.status(404).send({ message: 'Track not found.' });
    }
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: 'An error occurred while generating presigned URL.',
    });
  }
};

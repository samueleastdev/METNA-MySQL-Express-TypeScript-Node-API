import { Request, Response } from 'express';
import { catchError } from '../logging';
import db from '../models';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getBasename } from '../utils';

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

export const generatePresignedUrl = async (req: Request, res: Response) => {
  try {
    const operation = req.query.operation; // Determine the operation type (e.g., 'put' or 'delete')
    const filePath = req.query.filename;
    const key = `${req.userId}/${filePath}`;

    let params;

    if (operation === 'delete') {
      // Parameters for Delete operation
      params = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      });
    } else {
      // Parameters for Put operation
      let basename;
      if (typeof filePath === 'string') {
        basename = getBasename(filePath);
      }

      params = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ACL: basename === 'README.md' ? 'public-read' : undefined,
      });
    }

    const url = await getSignedUrl(s3Client, params, { expiresIn: 3600 });

    res.status(200).send(url);
  } catch (error) {
    catchError(res, error, 'An error occurred while generating presigned URL.');
  }
};

export const getS3Urls = async (req: Request, res: Response) => {
  try {
    const folderKey = `${req.userId}/${req.query.folder}/`;
    const listParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Prefix: folderKey,
    };

    console.log('folderKey', folderKey);

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
        return {
          basePath: object.Key?.replace(`${req.userId}/${req.query.folder}/`, ''),
          key: object.Key,
          url,
        };
      }),
    );

    res.status(200).send(urls);
  } catch (error) {
    catchError(res, error, 'An error occurred while getting s3 URLs.');
  }
};

export const validateRequest = async (req: Request, res: Response) => {
  try {
    const key = `${req.userId}/${req.query.folder}/.audibase`;

    const headObjectParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    };

    await s3Client.send(new HeadObjectCommand(headObjectParams));

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
    catchError(res, error, 'An error occurred while validating request.');
  }
};

export const getPreviewUrl = async (req: Request, res: Response) => {
  try {
    const trackName = req.query.name as string;
    const userId = req.query.userId as string;

    if (!trackName || !userId) {
      res.status(400).send('Missing required query parameters');
      return;
    }

    const objectKey = `${userId}/${trackName}/track.mp3`;
    const headParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: objectKey,
    };

    try {
      await s3Client.send(new HeadObjectCommand(headParams));

      const urlParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: objectKey,
      };

      const url = await getSignedUrl(s3Client, new GetObjectCommand(urlParams), {
        expiresIn: 3600,
      });

      res.send({ url });
    } catch (error) {
      const headErr = error as Error;
      if (headErr.name === 'NotFound' || headErr.message.includes('404')) {
        res.status(404).send('Object not found');
      } else {
        catchError(res, headErr, 'Error checking object existence');
      }
    }
  } catch (error) {
    catchError(res, error as Error, 'An error occurred while completing upload.');
  }
};

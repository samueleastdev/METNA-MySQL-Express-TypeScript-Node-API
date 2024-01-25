import { Request, Response } from 'express';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import db from '../models';
import { createFileTree, sanitizeForUrl } from '../utils';
import { catchError } from '../logging';

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
const User = db.user;

export const createTrack = async (req: Request, res: Response) => {
  try {
    const { name, description, files } = req.body;

    if (!name) {
      return res.status(400).send({
        message: 'Missing required fields. Please check your input.',
      });
    }

    const s3Folder = sanitizeForUrl(name);

    const [track, created] = await Track.findOrCreate({
      where: {
        sanitizedName: s3Folder,
        userId: req.userId,
      },
      defaults: {
        name,
        sanitizedName: s3Folder,
        description,
        files,
        userId: req.userId,
      },
    });

    if (created) {
      const key = `${req.userId}/${s3Folder}/.audibase`;
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: '',
      });
      const response = await s3Client.send(command);
      console.log('params', response);
      res.status(200).send('samueleast/track/1');
    } else {
      res.status(200).send({
        message: 'Track exists',
        data: track,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: 'An error occurred while creating the track.',
    });
  }
};

export const readTrack = async (req: Request, res: Response) => {
  try {
    const trackId = req.query.trackId;
    let folderPath: string | undefined;
    if (typeof req.query.folder === 'string') {
      folderPath = req.query.folder;
    } else {
      folderPath = undefined;
    }

    if (trackId) {
      const track = await Track.findOne({
        where: {
          id: trackId,
          userId: req.userId,
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: [
              'id',
              'email',
              'nicename',
              'description',
              'location',
              'experience',
              'profession',
              'createdAt',
            ],
          },
        ],
      });

      if (track) {
        track.files = createFileTree(track.files, folderPath);

        res.status(200).send(track);
      } else {
        res.status(404).send({ message: 'Track not found.' });
      }
    } else {
      const tracks = await Track.findAll({
        where: {
          userId: req.userId,
        },
      });

      res.status(200).send(tracks);
    }
  } catch (error) {
    catchError(res, error, 'An error occurred while retrieving track details.');
  }
};

export const updateTrack = async (req: Request, res: Response) => {
  try {
    const { trackId, name, description, daw, files } = req.body;

    if (!trackId) {
      return res.status(400).send({
        message: 'Missing required track ID.',
      });
    }

    const track = await Track.findByPk(trackId);

    if (!track) {
      return res.status(404).send({
        message: 'Track not found.',
      });
    }

    track.name = name || track.name;
    track.description = description || track.description;
    track.daw = daw || track.daw;
    track.files = files || track.files;
    await track.save();

    res.status(200).send({
      message: 'Track updated successfully.',
      data: track,
    });
  } catch (error) {
    catchError(res, error, 'An error occurred while updating the track.');
  }
};

export const deleteTrack = async (req: Request, res: Response) => {
  try {
    const { trackId } = req.body;

    if (!trackId) {
      return res.status(400).send({
        message: 'Missing required track ID.',
      });
    }

    const track = await Track.findByPk(trackId);

    if (!track) {
      return res.status(404).send({
        message: 'Track not found.',
      });
    }

    await track.destroy();

    res.status(200).send({
      message: 'Track deleted successfully.',
    });
  } catch (error) {
    catchError(res, error, 'An error occurred while deleting the track.');
  }
};

export const readTracks = async (req: Request, res: Response) => {
  try {
    const trackId = req.query.trackId;
    let folderPath: string | undefined;
    if (typeof req.query.folder === 'string') {
      folderPath = req.query.folder;
    } else {
      folderPath = undefined;
    }

    if (trackId) {
      const track = await Track.findOne({
        where: {
          id: trackId,
          isPrivate: false,
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: [
              'id',
              'email',
              'nicename',
              'description',
              'location',
              'experience',
              'profession',
              'createdAt',
            ],
          },
        ],
      });
      track.files = createFileTree(track.files, folderPath);
      res.status(200).send(track);
    } else {
      const tracks = await Track.findAll({
        where: {
          isPrivate: false,
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: [
              'id',
              'email',
              'nicename',
              'description',
              'location',
              'experience',
              'profession',
              'createdAt',
            ],
          },
        ],
      });

      res.status(200).send(tracks);
    }
  } catch (error) {
    catchError(res, error, 'An error occurred while retrieving track details.');
  }
};

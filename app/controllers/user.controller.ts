import { Request, Response } from 'express';
import Logger, { catchError } from '../logging';
import db from '../models';

const User = db.user;

export const readUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.userId,
      },
      attributes: [
        'email',
        'picture',
        'sub',
        'nicename',
        'description',
        'location',
        'experience',
        'profession',
        'createdAt',
      ],
    });
    res.status(200).send(user);
  } catch (error) {
    catchError(res, error, 'An error occurred while retrieving user details.');
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({
      where: {
        id: req.userId,
      },
      attributes: [
        'email',
        'nicename',
        'description',
        'location',
        'experience',
        'profession',
        'createdAt',
      ],
    });
    res.status(200).send(user);
  } catch (error) {
    catchError(res, error, 'An error occurred while retrieving user details.');
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { email, nicename, description, location, experience, profession } = req.body;

    const [updateCount] = await User.update(
      { email, nicename, description, location, experience, profession },
      { where: { id: req.userId } },
    );

    if (updateCount === 0) {
      return res.status(404).send({ message: 'User not found.' });
    }

    const updatedUser = await User.findOne({
      where: { id: req.userId },
      attributes: [
        'email',
        'nicename',
        'description',
        'location',
        'experience',
        'profession',
        'createdAt',
      ],
    });

    res.status(200).send(updatedUser);
  } catch (error) {
    catchError(res, error, 'An error occurred while updating user details.');
  }
};

export const userBoard = async (req: Request, res: Response) => {
  const logger = Logger.getInstance();
  logger.info(JSON.stringify(req.userId));
  try {
    const user = await User.findOne({
      where: {
        id: req.userId,
      },
    });
    res.status(200).send(user);
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: 'An error occurred while retrieving user details.',
    });
  }
};

export const adminBoard = (req: Request, res: Response) => {
  res.status(200).send('Admin Content.');
};

export const moderatorBoard = (req: Request, res: Response) => {
  res.status(200).send('Moderator Content.');
};

import { Request, Response } from 'express';
import Logger from '../logging';
import db from '../models';

const User = db.user;

export const allAccess = (req: Request, res: Response) => {
  res.status(200).send('Public Content.');
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

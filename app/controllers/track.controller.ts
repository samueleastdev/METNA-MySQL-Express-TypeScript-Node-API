import { Request, Response } from 'express';
import Logger from '../logging';
import db from '../models';

const Track = db.track;

export const createTrack = (req: Request, res: Response) => {
  res.status(200).send('Add Content.');
};

export const allAccess = (req: Request, res: Response) => {
  res.status(200).send('Public Content.');
};

export const userBoard = async (req: Request, res: Response) => {
  res.status(200).send('Track Content.');
};

export const adminBoard = (req: Request, res: Response) => {
  res.status(200).send('Admin Content.');
};

export const moderatorBoard = (req: Request, res: Response) => {
  res.status(200).send('Moderator Content.');
};

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config/auth.config.js';
import db from '../models/index.js';
import { JwtPayload } from 'jsonwebtoken';

declare module 'express' {
  interface Request {
    userId?: number; // Define the userId property
  }
}

const User = db.user;

const { TokenExpiredError } = jwt;

/* eslint-disable @typescript-eslint/no-explicit-any */
const catchError = (err: any, res: Response) => {
  if (err instanceof TokenExpiredError) {
    return res.status(401).send({ message: 'Unauthorized! Access Token was expired!' });
  }

  return res.sendStatus(401).send({ message: 'Unauthorized!' });
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers['x-access-token'] as string;

    if (!token) {
      return res.status(403).send({
        message: 'No token provided!',
      });
    }

    const decoded = jwt.verify(token, config.secret) as JwtPayload;

    if (!decoded) {
      return res.status(401).send({
        message: 'Unauthorized!',
      });
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    return catchError(err, res);
  }
};

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === 'admin') {
        next();
        return;
      }
    }

    res.status(403).send({
      message: 'Require Admin Role!',
    });
  } catch (err) {
    res.status(500).send({
      message: 'An error occurred while checking admin role.',
    });
  }
};

const isModerator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === 'moderator') {
        next();
        return;
      }
    }

    res.status(403).send({
      message: 'Require Moderator Role!',
    });
  } catch (err) {
    res.status(500).send({
      message: 'An error occurred while checking moderator role.',
    });
  }
};

const isModeratorOrAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.userId);
    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === 'moderator' || roles[i].name === 'admin') {
        next();
        return;
      }
    }

    res.status(403).send({
      message: 'Require Moderator or Admin Role!',
    });
  } catch (err) {
    res.status(500).send({
      message: 'An error occurred while checking moderator or admin role.',
    });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  isModeratorOrAdmin,
};

export default authJwt;

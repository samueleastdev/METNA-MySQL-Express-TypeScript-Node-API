import { Request, Response, NextFunction } from 'express';
import Logger from '../logging';
import db from '../models';

const ROLES = db.ROLES;
const User = db.user;

const isValidEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
};

const validateSignUpValues = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.username) {
    res.status(400).send({
      message: 'Failed! Username is required!',
    });
    return;
  }
  if (!req.body.email) {
    res.status(400).send({
      message: 'Failed! Email is required!',
    });
    return;
  }

  if (!isValidEmail(req.body.email)) {
    res.status(400).send({
      message: 'Failed! Email is not valid!',
    });
    return;
  }

  if (!req.body.password) {
    res.status(400).send({
      message: 'Failed! Password is required!',
    });
    return;
  }
  if (!req.body.roles) {
    res.status(400).send({
      message: 'Failed! Roles is required!',
    });
    return;
  }
  next();
};

const checkDuplicateUsernameOrEmail = async (req: Request, res: Response, next: NextFunction) => {
  const logger = Logger.getInstance();
  logger.info(JSON.stringify(req.body));
  try {
    const usernameUser = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (usernameUser) {
      return res.status(400).send({
        message: 'Failed! Username is already in use!',
      });
    }

    // Check if email exists
    const emailUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (emailUser) {
      return res.status(400).send({
        message: 'Failed! Email is already in use!',
      });
    }

    next();
  } catch (error) {
    logger.error(error);
    return res.status(500).send({
      message: 'An error occurred while checking duplicate username or email.',
    });
  }
};

const checkRolesExisted = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        res.status(400).send({
          message: 'Failed! Role does not exist = ' + req.body.roles[i],
        });
        return;
      }
    }
  }

  next();
};

const verifySignUp = {
  validateSignUpValues,
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

export default verifySignUp;

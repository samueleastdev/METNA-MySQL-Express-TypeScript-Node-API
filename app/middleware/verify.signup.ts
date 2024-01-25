import { Request, Response, NextFunction } from 'express';
import Logger, { catchError } from '../logging';
import db from '../models';

const ROLES = db.ROLES;
const User = db.user;

const isValidEmail = (email: string) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(email);
};

const validateSignUpValues = (req: Request, res: Response, next: NextFunction) => {
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
  try {
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
    catchError(res, error, 'An error occurred while checking duplicate username or email.');
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

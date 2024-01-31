import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import db from '../models';
import { config } from '../config/auth.config';
import { catchError } from '../logging';
import { generateRandomString, isStrongPassword } from '../utils';

const client = new OAuth2Client(process.env.AUTH_GOOGLE_CLIENT_ID);

const User = db.user;
const Role = db.role;
const RefreshToken = db.refreshToken;

const Op = db.Sequelize.Op;

interface RefreshTokenAttributes {
  id: number;
  token: string;
  expiryDate: Date;
  userId: number;
}

export const signup = async (req: Request, res: Response) => {
  try {
    const user = await User.create({
      nicename: req.body.nicename,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    if (req.body.roles) {
      const roles = await Role.findAll({
        where: {
          name: {
            [Op.or]: req.body.roles,
          },
        },
      });
      await user.setRoles(roles);
    } else {
      await user.setRoles([1]);
    }

    res.send({ message: 'User registered successfully!' });
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    catchError(res, error, error.message);
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (!user) {
      return res.status(404).send({ message: 'User Not found.' });
    }

    const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: 'Invalid Password!',
      });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      algorithm: 'HS256',
      allowInsecureKeySizes: true,
      expiresIn: config.jwtExpiration,
    });

    const authorities: string[] = [];
    const roles = await user.getRoles();
    for (let i = 0; i < roles.length; i++) {
      authorities.push('ROLE_' + roles[i].name.toUpperCase());
    }

    const refreshToken = await createRefreshToken(user);

    res.status(200).send({
      id: user.id,
      email: user.email,
      roles: authorities,
      accessToken: token,
      refreshToken: refreshToken,
    });
    /* eslint-disable @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    catchError(res, error, error.message);
  }
};

export const password = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const newPassword = req.body.password;
    const passwordCheck = req.body.passwordCheck;

    if (newPassword !== passwordCheck) {
      return res.status(404).send({ message: 'Passwords dont match' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(404).send({
        message:
          'Passwords is not string enough one uppercase letter atleast 10 chararcter and a special character is needed',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    user.password = bcrypt.hashSync(newPassword, 8);
    await user.save();

    res.send({ message: 'Password updated successfully!' });
  } catch (error) {
    catchError(res, error, 'Password update failed!');
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const createRefreshToken = async (user: any) => {
  const expiredAt = new Date();

  expiredAt.setSeconds(expiredAt.getSeconds() + config.jwtRefreshExpiration);

  const _token = uuidv4();

  const refreshToken = await RefreshToken.create({
    token: _token,
    userId: user.id,
    expiryDate: expiredAt.getTime(),
  });

  return refreshToken.token;
};

const verifyExpiration = (token: RefreshTokenAttributes) => {
  return token.expiryDate.getTime() < new Date().getTime();
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: requestToken } = req.body;

  if (requestToken == null) {
    return res.status(403).json({ message: 'Refresh Token is required!' });
  }

  try {
    const refreshToken = await RefreshToken.findOne({ where: { token: requestToken } });

    if (!refreshToken) {
      res.status(403).json({ message: 'Refresh token is not in database!' });
      return;
    }

    if (verifyExpiration(refreshToken)) {
      RefreshToken.destroy({ where: { id: refreshToken.id } });

      res.status(403).json({
        message: 'Refresh token was expired. Please make a new signin request',
      });
      return;
    }

    const user = await refreshToken.getUser();

    const newAccessToken = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshToken.token,
    });
  } catch (error) {
    catchError(res, error, 'Error refreshing token');
  }
};

async function verify(token: string) {
  console.log('GG: verify: ', token);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.AUTH_GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
}

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const googleToken = req.body.credential;

    const googleUser = await verify(googleToken);

    if (!googleUser) {
      return res.status(404).send({ message: 'User Not found.' });
    }

    let user = await User.findOne({ where: { email: googleUser.email } });

    if (user) {
      const updatedUser = await User.update(
        {
          sub: googleUser.sub,
          picture: googleUser.picture,
        },
        {
          where: {
            id: user.id,
          },
        },
      );
      if (updatedUser[0] === 1) {
        console.log('User updated successfully');
      } else {
        return res.status(403).json({ message: 'User not found or no changes made!' });
      }
    } else {
      user = await User.create({
        nicename: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        password: bcrypt.hashSync(generateRandomString(15), 8),
        sub: googleUser.sub,
      });
    }

    const token = jwt.sign({ id: user.id }, config.secret, {
      algorithm: 'HS256',
      allowInsecureKeySizes: true,
      expiresIn: config.jwtExpiration,
    });

    const authorities: string[] = [];
    const roles = await user.getRoles();
    for (let i = 0; i < roles.length; i++) {
      authorities.push('ROLE_' + roles[i].name.toUpperCase());
    }

    const refreshToken = await createRefreshToken(user);

    res.status(200).send({
      id: user.id,
      email: user.email,
      roles: authorities,
      accessToken: token,
      refreshToken: refreshToken,
    });

    /* eslint-disable @typescript-eslint/no-explicit-any */
  } catch (error: any) {
    catchError(res, error, error.message);
  }
};

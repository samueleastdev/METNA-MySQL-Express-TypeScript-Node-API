/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Express, Request } from 'express';
import verifySignUp from './verify.signup';
import db from '../models';

const app: Express = express();
app.use(express.json());

const mockUser = {
  findOne: jest.fn(),
};

db.user = mockUser as any;

describe('verifySignUp Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateSignUpValues Function', () => {
    it('should call next() when email, password, roles is provided', () => {
      const req: Request = {
        body: {
          email: 'test@test.com',
          password: '12345',
          roles: ['user'],
        },
      } as Request;

      const res: any = {};
      const next = jest.fn();

      verifySignUp.validateSignUpValues(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should send a 400 response when email is missing', () => {
      const req = {
        body: {},
      } as Request;
      const res: any = {
        status: jest.fn(() => res),
        send: jest.fn(),
      };
      const next = jest.fn();

      verifySignUp.validateSignUpValues(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Failed! Email is required!',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkRolesExisted Function', () => {
    it('should call next() when roles exist and are valid', () => {
      const req = {
        body: {
          roles: ['user', 'admin'],
        },
      } as Request;
      const res: any = {};
      const next = jest.fn();

      verifySignUp.checkRolesExisted(req, res, next);

      expect(next).toHaveBeenCalled();
    });
    it('should send a 400 response when roles do not exist', () => {
      const req = {
        body: {
          roles: ['user', 'invalidRole'],
        },
      } as Request;
      const res: any = {
        status: jest.fn(() => res),
        send: jest.fn(),
      };

      const next = jest.fn();

      verifySignUp.checkRolesExisted(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Failed! Role does not exist = invalidRole',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when roles array is empty', () => {
      const req = {
        body: {
          roles: [],
        },
      } as Request;
      const res: any = {};
      const next = jest.fn();

      verifySignUp.checkRolesExisted(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should call next() when roles are not provided', () => {
      const req = {
        body: {},
      } as Request;
      const res: any = {};
      const next = jest.fn();

      verifySignUp.checkRolesExisted(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});

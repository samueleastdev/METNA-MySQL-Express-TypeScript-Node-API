import { Express, Request, Response, NextFunction } from 'express';
import { authJwt, verifySignUp } from '../middleware';
import * as controller from '../controllers/auth.controller';

export default function (app: Express) {
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
  });

  app.post(
    '/api/auth/signup',
    [
      verifySignUp.validateSignUpValues,
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted,
    ],
    controller.signup,
  );

  app.post('/api/auth/signin', controller.signin);

  app.post('/api/auth/refreshtoken', controller.refreshToken);

  app.post('/api/auth/google', controller.googleAuth);

  app.put('/api/auth/password', [authJwt.verifyToken], controller.password);
}

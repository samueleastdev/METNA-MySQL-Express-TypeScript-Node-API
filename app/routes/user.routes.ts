import { Express, Request, Response, NextFunction } from 'express';
import { authJwt } from '../middleware';
import * as controller from '../controllers/user.controller';

export default function (app: Express) {
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
  });

  app.get('/api/user', [authJwt.verifyToken], controller.readUser);

  app.post('/api/user', [authJwt.verifyToken], controller.createUser);

  app.put('/api/user', [authJwt.verifyToken], controller.updateUser);

  app.get('/api/users/user', [authJwt.verifyToken], controller.userBoard);

  app.get('/api/users/mod', [authJwt.verifyToken, authJwt.isModerator], controller.moderatorBoard);

  app.get('/api/users/admin', [authJwt.verifyToken, authJwt.isAdmin], controller.adminBoard);
}

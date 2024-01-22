import { Express, Request, Response, NextFunction } from 'express';
import { authJwt } from '../middleware';
import * as controller from '../controllers/track.controller';

export default function (app: Express) {
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
  });

  app.post('/api/track', [authJwt.verifyToken], controller.createTrack);

  app.get('/api/track/all', controller.allAccess);

  app.get('/api/track/user', [authJwt.verifyToken], controller.userBoard);

  app.get('/api/track/mod', [authJwt.verifyToken, authJwt.isModerator], controller.moderatorBoard);

  app.get('/api/track/admin', [authJwt.verifyToken, authJwt.isAdmin], controller.adminBoard);
}

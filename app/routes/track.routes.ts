import { Express, Request, Response, NextFunction } from 'express';
import { authJwt } from '../middleware';
import * as controller from '../controllers/track.controller';

export default function (app: Express) {
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
  });

  app.post('/api/track', [authJwt.verifyToken], controller.createTrack);

  app.get('/api/track', [authJwt.verifyToken], controller.readTrack);

  app.put('/api/track', [authJwt.verifyToken], controller.updateTrack);

  app.delete('/api/track', [authJwt.verifyToken], controller.deleteTrack);

  app.get('/api/tracks', controller.readTracks);
}

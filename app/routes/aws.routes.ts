import { Express, Request, Response, NextFunction } from 'express';
import { authJwt } from '../middleware';
import * as controller from '../controllers/aws.controller';

export default function (app: Express) {
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
  });

  app.get(
    '/api/aws/generate-presigned-url',
    [authJwt.verifyToken],
    controller.generatePresignedUrl,
  );
}

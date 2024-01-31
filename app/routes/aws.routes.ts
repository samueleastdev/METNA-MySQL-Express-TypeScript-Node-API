import { Express, Request, Response, NextFunction } from 'express';
import { authJwt } from '../middleware';
import * as controller from '../controllers/aws.controller';

export default function (app: Express) {
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
  });

  app.get('/api/aws/get-s3-urls', [authJwt.verifyToken], controller.getS3Urls);

  app.get(
    '/api/aws/presigned/upload',
    [authJwt.verifyToken],
    controller.generatePresignedUploadUrl,
  );

  app.get(
    '/api/aws/presigned/delete',
    [authJwt.verifyToken],
    controller.generatePresignedDeleteUrl,
  );

  app.get('/api/aws/validate-request', [authJwt.verifyToken], controller.validateRequest);

  app.get('/api/aws/get-preview-url', controller.getPreviewUrl);
}

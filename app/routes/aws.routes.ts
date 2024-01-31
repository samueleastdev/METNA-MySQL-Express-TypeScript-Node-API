import { Express, Request, Response, NextFunction } from 'express';
import { authJwt } from '../middleware';
import * as controller from '../controllers/aws.controller';

export default function (app: Express) {
  app.use(function (req: Request, res: Response, next: NextFunction) {
    res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
    next();
  });

  app.get('/api/aws/start-upload', [authJwt.verifyToken], controller.startUpload);

  app.get('/api/aws/get-upload-url', [authJwt.verifyToken], controller.getUploadUrl);

  app.post('/api/aws/complete-upload', [authJwt.verifyToken], controller.completeUpload);

  app.get('/api/aws/get-s3-urls', [authJwt.verifyToken], controller.getS3Urls);

  app.get(
    '/api/aws/generate-presigned-url',
    [authJwt.verifyToken],
    controller.generatePresignedUrl,
  );

  app.get('/api/aws/validate-request', [authJwt.verifyToken], controller.validateRequest);

  app.get('/api/aws/get-preview-url', controller.getPreviewUrl);
}

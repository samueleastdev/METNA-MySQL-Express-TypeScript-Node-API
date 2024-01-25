import express, { Request, Response } from 'express';
import cors from 'cors';
import db from './models';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import awsRoutes from './routes/aws.routes';
import trackRoutes from './routes/track.routes';
import Logger from './logging';

const app = express();

app.use(cors({ credentials: true, origin: ['http://localhost:8100', 'http://localhost:3000'] }));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const logger = Logger.getInstance();

  switch (req.method) {
    case 'POST':
      logger.network(`[POST] Route: ${req.originalUrl}, Body: ${JSON.stringify(req.body)}`);
      break;

    case 'GET':
      logger.network(`[GET] Route: ${req.originalUrl}, Query: ${JSON.stringify(req.query)}`);
      break;

    case 'PUT':
      logger.network(`[PUT] Route: ${req.originalUrl}, Body: ${JSON.stringify(req.body)}`);
      break;

    default:
      logger.network(`[${req.method}] Route: ${req.originalUrl}`);
      break;
  }

  next();
});

db.sequelize.sync();
// Force: true will drop the table if it already exists
/*db.sequelize.sync({ force: true }).then(() => {
  console.log('Drop and Resync Database with { force: true }');
  const Role = db.role;

  Role.create({
    id: 1,
    name: 'user',
  });

  Role.create({
    id: 2,
    name: 'moderator',
  });

  Role.create({
    id: 3,
    name: 'admin',
  });
});*/

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'App Started' });
});

authRoutes(app);
userRoutes(app);
awsRoutes(app);
trackRoutes(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

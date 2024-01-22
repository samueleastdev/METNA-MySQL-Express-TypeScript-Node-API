import { dbConfig } from '../config/db.config';
import { Sequelize } from 'sequelize';
import userModel from './user.model';
import roleModel from './role.model';
import refreshTokenModel from './refresh.token.model';
import tracksModel from './track.model';

const sequelize = new Sequelize(dbConfig.DB_DATABASE, dbConfig.DB_USERNAME, dbConfig.DB_PASSWORD, {
  host: dbConfig.DB_HOST,
  dialect: 'mysql',
  dialectOptions: {
    port: dbConfig.DB_PORT,
    socketPath: dbConfig.DB_SOCKET,
  },
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const db: any = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = userModel(sequelize);
db.role = roleModel(sequelize);
db.refreshToken = refreshTokenModel(sequelize);
db.track = tracksModel(sequelize);

db.role.belongsToMany(db.user, {
  through: 'user_roles',
});

db.user.belongsToMany(db.role, {
  through: 'user_roles',
});

db.refreshToken.belongsTo(db.user, {
  foreignKey: 'userId',
  targetKey: 'id',
});

db.user.hasOne(db.refreshToken, {
  foreignKey: 'userId',
  targetKey: 'id',
});

db.track.belongsTo(db.user, {
  foreignKey: 'userId',
  targetKey: 'id',
});

db.ROLES = ['user', 'admin', 'moderator'];

export default db;

import { Sequelize, Model, DataTypes } from 'sequelize';

export default (sequelize: Sequelize) => {
  class Tracks extends Model {
    public username!: string;
    public email!: string;
    public password!: string;
  }

  Tracks.init(
    {
      name: {
        type: DataTypes.STRING,
      },
      sanitizedName: {
        type: DataTypes.STRING,
      },
      path: {
        type: DataTypes.STRING,
      },
      files: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'tracks',
    },
  );

  return Tracks;
};

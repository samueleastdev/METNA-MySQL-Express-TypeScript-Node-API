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
      daw: {
        type: DataTypes.STRING,
      },
      genre: {
        type: DataTypes.STRING,
      },
      description: {
        type: DataTypes.TEXT,
      },
      files: {
        type: DataTypes.JSON,
      },
      isPrivate: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      sequelize,
      modelName: 'tracks',
    },
  );

  return Tracks;
};

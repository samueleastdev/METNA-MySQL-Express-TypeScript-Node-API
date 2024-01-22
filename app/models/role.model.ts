import { Sequelize, Model, DataTypes } from 'sequelize';

export default (sequelize: Sequelize) => {
  class Role extends Model {
    public id!: number;
    public name!: string;
  }

  Role.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      modelName: 'roles',
    },
  );

  return Role;
};

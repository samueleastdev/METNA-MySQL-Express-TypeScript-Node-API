import { DataTypes, Model, Sequelize } from 'sequelize';

export default (sequelize: Sequelize) => {
  class RefreshToken extends Model {
    public id!: number;
    public token!: string;
    public expiryDate!: Date;
    public userId!: number;
  }

  RefreshToken.init(
    {
      token: {
        type: DataTypes.STRING,
      },
      expiryDate: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'user_tokens',
    },
  );

  return RefreshToken;
};

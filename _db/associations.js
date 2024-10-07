import { Sequelize, Model } from 'sequelize';
const DB_FILE_PATH = '_data__.sqlite';

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_FILE_PATH,
  define: {
    freezeTableName: true,
    timestamps: false,
  },

  logging: (msg) => {
    if (msg.startsWith('Executed')) {
      console.log(msg);
    }
  },
});



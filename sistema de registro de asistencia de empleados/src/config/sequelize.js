'use strict';
require('dotenv').config();
const { dbEnv } = require('./dbEnv');

const { database, username, password, host, port } = dbEnv();

module.exports = {
  development: {
    username,
    password,
    database,
    host,
    port,
    dialect: 'mysql',
    logging: false,
  },
  test: {
    username,
    password,
    database: 'asistencia_test',
    host,
    port,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    username,
    password,
    database,
    host,
    port,
    dialect: 'mysql',
    logging: false,
  },
};

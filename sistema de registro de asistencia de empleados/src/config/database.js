'use strict';
const { Sequelize } = require('sequelize');
require('dotenv').config();
const { dbEnv } = require('./dbEnv');

const { database, username, password, host, port } = dbEnv();

const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;

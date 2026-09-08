/**
 * @file Modelo Sequelize para la tabla `asistencias`.
 * Cada registro representa una marca de entrada o salida de un usuario.
 * @module models/Asistencia
 */

'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Define el modelo Sequelize para la tabla `asistencias`.
 * Sus columnas son id, usuario_id, tipo y fecha_hora.
 * @param {import('sequelize').Sequelize} sequelize - La instancia de Sequelize.
 * @returns {import('sequelize').ModelCtor<import('sequelize').Model>} El modelo Sequelize para la tabla `asistencias`.
 */
const Asistencia = sequelize.define('Asistencia', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'usuarios', key: 'id' },
  },
  tipo: {
    type: DataTypes.ENUM('entrada', 'salida'),
    allowNull: false,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'asistencias',
  underscored: true,
});

module.exports = Asistencia;

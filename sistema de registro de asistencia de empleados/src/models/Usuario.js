/**
 * @file Modelo Sequelize para la tabla `usuarios`.
 * Representa a las personas que pueden autenticarse en el sistema
 * (administradores o empleados) y registrar asistencias.
 * @module models/Usuario
 */

'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Define el modelo Sequelize para la tabla `usuarios`.
 * Sus columnas son id, nombre, email, password, rol y estado.
 * @param {import('sequelize').Sequelize} sequelize - La instancia de Sequelize.
 * @returns {import('sequelize').ModelCtor<import('sequelize').Model>} El modelo Sequelize para la tabla `usuarios`.
 */
const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: true, notEmpty: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true },
  },
  rol: {
    type: DataTypes.ENUM('administrador', 'empleado'),
    defaultValue: 'empleado',
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo',
    allowNull: false,
  },
}, {
  tableName: 'usuarios',
  underscored: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.password) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('password')) {
        usuario.password = await bcrypt.hash(usuario.password, 10);
      }
    },
  },
});

/**
 * Compara una contraseña proporcionada con la contraseña almacenada en la base de datos.
 * @param {string} password - La contraseña a comparar.
 * @returns {Promise<boolean>} Verdadero si las contraseñas coinciden, falso en caso contrario.
 */
Usuario.prototype.validarPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

/**
 * Sobrescribe el método toJSON para excluir la contraseña al serializar el modelo.
 * @returns {Object} El objeto serializado del usuario sin la contraseña.
 */
Usuario.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

module.exports = Usuario;

/**
 * @file Punto central de acceso a los modelos de Sequelize.
 * Define las asociaciones entre modelos y re-exporta cada uno para que el
 * resto de la aplicacion los importe desde un unico lugar
 * (ej. `require('../models')`).
 * @module models/index
 */

'use strict';
const Usuario = require('./Usuario');
const Asistencia = require('./Asistencia');

// Un usuario puede tener muchas asistencias, y cada asistencia pertenece a un usuario
Usuario.hasMany(Asistencia, { foreignKey: 'usuario_id', as: 'asistencias' });
Asistencia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = { Usuario, Asistencia };

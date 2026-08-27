'use strict';
const Usuario = require('./Usuario');
const Asistencia = require('./Asistencia');

Usuario.hasMany(Asistencia, { foreignKey: 'usuario_id', as: 'asistencias' });
Asistencia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

module.exports = { Usuario, Asistencia };

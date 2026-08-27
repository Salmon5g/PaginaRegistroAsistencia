'use strict';
const { Usuario } = require('../models');

async function seedAdmin() {
  try {
    const existe = await Usuario.findOne({ where: { email: 'admin@asistencia.cl' } });
    if (!existe) {
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@asistencia.cl',
        password: 'admin123',
        rol: 'administrador',
        estado: 'activo',
      });
      console.log('Usuario administrador creado: admin@asistencia.cl / admin123');
    } else {
      console.log('El usuario administrador ya existe.');
    }
  } catch (err) {
    console.error('Error al crear admin:', err.message);
  }
}

module.exports = { seedAdmin };

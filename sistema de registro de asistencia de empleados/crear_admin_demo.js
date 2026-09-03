'use strict';
require('dotenv').config();
const sequelize = require('./src/config/database');
const { Usuario } = require('./src/models');

async function main() {
  await sequelize.authenticate();
  const email = 'admin2@demo.cl';
  const existente = await Usuario.findOne({ where: { email } });
  if (existente) {
    console.log('El usuario de demo ya existe.');
  } else {
    await Usuario.create({
      nombre: 'Administrador Demo',
      email,
      password: 'admin123',
      rol: 'administrador',
      estado: 'activo',
    });
    console.log('Creado admin de demo: admin2@demo.cl / admin123');
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });

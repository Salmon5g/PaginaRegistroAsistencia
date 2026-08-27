'use strict';
const app       = require('./app');
const sequelize = require('./config/database');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

async function connectDB() {
  const timeout = new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error('Timeout: la BD no respondio en 10 segundos')),
      10_000
    )
  );
  try {
    await Promise.race([sequelize.authenticate(), timeout]);
    console.log('Conexion a la base de datos establecida correctamente.');
  } catch (err) {
    console.error('No se pudo conectar a la base de datos:');
    console.error('  Mensaje:', err.message);
    console.error('  Codigo:', err.code || 'N/A');
  }
}

connectDB();

'use strict';

/**
 * Resuelve los datos de conexion a MySQL. Prioriza las variables `DB_*`
 * (usadas en desarrollo local) y, si no estan, cae a las que inyecta
 * Railway para su plugin de MySQL (`MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`,
 * `MYSQLPASSWORD`, `MYSQLDATABASE`), evitando mapear variables a mano.
 * @returns {{database: string, username: string, password: string, host: string, port: number}}
 */
function dbEnv() {
  return {
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'asistencia_db',
    username: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASS || process.env.MYSQLPASSWORD || '',
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
  };
}

module.exports = { dbEnv };
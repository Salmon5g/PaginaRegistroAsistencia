'use strict';
require('dotenv').config();
const sequelize = require('./src/config/database');
const { Asistencia } = require('./src/models');

async function main() {
  await sequelize.authenticate();
  console.log('Conectado a la BD.');

  const usuarios = await sequelize.query('SELECT id, nombre FROM usuarios WHERE estado = "activo"', {
    type: require('sequelize').QueryTypes.SELECT,
  });

  const empleado = usuarios.find((u) => String(u.nombre).toLowerCase() !== 'administrador') || usuarios[0];
  const admin = usuarios.find((u) => String(u.nombre).toLowerCase() === 'administrador') || empleado;

  console.log(`Empleado de prueba: ${empleado.nombre} (id=${empleado.id})`);
  console.log(`Admin de prueba: ${admin.nombre} (id=${admin.id})`);

  function fechas(fecha, hora, min) {
    const d = new Date(`${fecha}T${hora}:${min}:00`);
    return d;
  }

  const filas = [
    // ==== Atrasos: entradas posteriores a 9:30 ====
    { usuario_id: empleado.id, tipo: 'entrada', fecha: '2026-08-03', h: '09', m: '45' },
    { usuario_id: empleado.id, tipo: 'salida',  fecha: '2026-08-03', h: '18', m: '00' },
    { usuario_id: empleado.id, tipo: 'entrada', fecha: '2026-08-04', h: '10', m: '15' },
    { usuario_id: empleado.id, tipo: 'salida',  fecha: '2026-08-04', h: '18', m: '10' },
    // atraso para el admin
    { usuario_id: admin.id,    tipo: 'entrada', fecha: '2026-08-05', h: '09', m: '40' },
    { usuario_id: admin.id,    tipo: 'salida',  fecha: '2026-08-05', h: '18', m: '30' },
    // entrada a tiempo (no es atraso) mismo empleado
    { usuario_id: empleado.id, tipo: 'entrada', fecha: '2026-08-06', h: '09', m: '00' },
    { usuario_id: empleado.id, tipo: 'salida',  fecha: '2026-08-06', h: '18', m: '00' },

    // ==== Salidas anticipadas: salidas anteriores a 17:30 ====
    { usuario_id: empleado.id, tipo: 'entrada', fecha: '2026-08-10', h: '09', m: '00' },
    { usuario_id: empleado.id, tipo: 'salida',  fecha: '2026-08-10', h: '17', m: '20' },
    { usuario_id: empleado.id, tipo: 'entrada', fecha: '2026-08-11', h: '09', m: '05' },
    { usuario_id: empleado.id, tipo: 'salida',  fecha: '2026-08-11', h: '16', m: '45' },
    { usuario_id: admin.id,    tipo: 'entrada', fecha: '2026-08-12', h: '09', m: '10' },
    { usuario_id: admin.id,    tipo: 'salida',  fecha: '2026-08-12', h: '17', m: '00' },

    // ==== Un dia de asistencia normal (para no ser inasistencia) ====
    { usuario_id: empleado.id, tipo: 'entrada', fecha: '2026-09-01', h: '09', m: '00' },
    { usuario_id: empleado.id, tipo: 'salida',  fecha: '2026-09-01', h: '18', m: '00' },

    // ==== DIA SIN ASISTENCIA (para reporte de inasistencias) ====
    // 02 y 03 de septiembre: el admin NO registra nada -> inasistencia
    // 02-09: solo el empleado marca -> el admin queda inasistente
    { usuario_id: empleado.id, tipo: 'entrada', fecha: '2026-09-02', h: '09', m: '00' },
    { usuario_id: empleado.id, tipo: 'salida',  fecha: '2026-09-02', h: '18', m: '00' },
  ];

  await Asistencia.bulkCreate(filas.map((f) => ({
    usuario_id: f.usuario_id,
    tipo: f.tipo,
    fecha_hora: fechas(f.fecha, f.h, f.m),
  })));

  console.log(`Insertadas ${filas.length} asistencias de prueba.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });

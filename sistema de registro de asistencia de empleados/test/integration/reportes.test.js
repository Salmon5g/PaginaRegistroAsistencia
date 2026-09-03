'use strict';
const { test, mock } = require('node:test');
const assert = require('node:assert/strict');

const reportesService = require('../../src/services/reportes');

function asyncResult(fn) {
  return Promise.resolve(fn());
}

function makeResponse() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.body = obj;
    return res;
  };
  return res;
}

async function withQueryMock(queryImpl, fn) {
  const sequelize = require('../../src/config/database');
  const original = sequelize.query;
  sequelize.query = queryImpl;
  try {
    await fn();
  } finally {
    sequelize.query = original;
  }
}

test('INTEGRACION: el controller de reportes define las tres funciones', () => {
  const reporteController = require('../../src/controllers/reporteController');
  assert.equal(typeof reporteController.reporteAtrasos, 'function');
  assert.equal(typeof reporteController.reporteSalidasAnticipadas, 'function');
  assert.equal(typeof reporteController.reporteInasistencias, 'function');
});

test('INTEGRACION: reporte de inasistencias devuelve solo inasistentes activos', async () => {
  const { reporteInasistencias } = require('../../src/controllers/reporteController');
  const req = { query: { fecha: '2024-01-01' } };
  const res = makeResponse();

  await withQueryMock(async (sql) => {
    if (sql.toLowerCase().includes('from usuarios') && !sql.toLowerCase().includes('from asistencias')) {
      return [
        { id: 1, nombre: 'Ana', email: 'ana@x.cl', estado: 'activo' },
        { id: 2, nombre: 'Luis', email: 'luis@x.cl', estado: 'activo' },
        { id: 3, nombre: 'Inactivo', email: 'i@x.cl', estado: 'inactivo' },
      ];
    }
    return [
      { usuario_id: 1, fecha_hora: '2024-01-01T08:30:00' },
    ];
  }, () => reporteInasistencias(req, res));

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.fecha, '2024-01-01');
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].usuario_id, 2);
});

test('INTEGRACION: reporte de inasistencias responde 500 ante error de BD', async () => {
  const { reporteInasistencias } = require('../../src/controllers/reporteController');
  const req = { query: {} };
  const res = makeResponse();

  await withQueryMock(async () => {
    throw new Error('connection lost');
  }, () => reporteInasistencias(req, res));

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.ok, false);
});

test('UNIT: obtenerEntradasAtrasadas no rompe con fechas Date nativas', () => {
  const marcas = [
    { tipo: 'entrada', fecha_hora: new Date(2024, 0, 1, 10, 0) },
    { tipo: 'entrada', fecha_hora: new Date(2024, 0, 1, 8, 0) },
  ];
  const out = reportesService.obtenerEntradasAtrasadas(marcas);
  assert.equal(out.length, 1);
});

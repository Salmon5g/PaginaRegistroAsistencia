'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { Asistencia } = require('../../src/models');
const { registrar, estadoActual, listarMisAsistencias, listarTodas } = require('../../src/controllers/asistenciaController');
const { instanteEnZona, ZONA_JORNADA } = require('../../src/services/jornada');

function makeResponse() {
  const res = { statusCode: 200, body: null };
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (obj) {
    this.body = obj;
    return this;
  };
  return res;
}

function makeRequest(over = {}) {
  return { body: {}, usuario: { id: 1 }, ...over };
}

/**
 * Instante de una hora concreta segun el calendario de la zona de jornadas
 * (America/Santiago), independiente de la zona horaria del equipo que corre
 * los tests. 10:00 = despues de la hora de inicio (09:30); 08:00 = antes.
 */
function aLas(hora, minuto = 0) {
  return instanteEnZona(2024, 1, 5, hora, minuto, 0, 0, ZONA_JORNADA);
}

/**
 * Crea mocks de Asistencia.findAll y Asistencia.create que mantienen el
 * listado de marcas del dia en memoria, imitando la base de datos.
 */
function mockAsistencia(t, marcasIniciales = []) {
  const marcas = [...marcasIniciales];
  t.mock.method(Asistencia, 'findAll', async () => marcas);
  t.mock.method(Asistencia, 'create', async (datos) => {
    marcas.push({ tipo: datos.tipo });
    return { id: 10, ...datos };
  });
  return marcas;
}

test('registrar: rechaza tipo invalido', async () => {
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'otro' } }), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
  assert.ok(res.body.message.includes('entrada'));
});

test('registrar: registra entrada cuando no hay marcas previas', async (t) => {
  mockAsistencia(t);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'entrada' } }), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.data.id, 10);
  assert.equal(res.body.data.tipo, 'entrada');
  assert.equal(res.body.estado.puedeEntrada, false);
  assert.equal(res.body.estado.puedeSalida, true);
});

test('registrar: rechaza entrada antes de la hora de inicio de jornada', async (t) => {
  mockAsistencia(t);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'entrada' } }), res, { ahora: aLas(8) });
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.toLowerCase().includes('jornada comienza'));
  assert.equal(res.body.estado.puedeEntrada, false);
  assert.equal(res.body.estado.puedeSalida, false);
});

test('registrar: rechaza una segunda entrada el mismo dia', async (t) => {
  mockAsistencia(t, [{ tipo: 'entrada' }]);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'entrada' } }), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes('una entrada por jornada'));
  assert.equal(res.body.estado.puedeSalida, true);
});

test('registrar: rechaza entrada cuando la jornada ya esta completa', async (t) => {
  mockAsistencia(t, [{ tipo: 'entrada' }, { tipo: 'salida' }]);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'entrada' } }), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes('una entrada por jornada'));
  assert.equal(res.body.estado.jornadaCompleta, true);
  assert.equal(res.body.estado.puedeEntrada, false);
  assert.equal(res.body.estado.puedeSalida, false);
});

test('registrar: rechaza salida sin entrada previa', async (t) => {
  mockAsistencia(t);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'salida' } }), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes('Debes marcar tu entrada'));
  assert.equal(res.body.estado.puedeEntrada, true);
});

test('registrar: rechaza salida cuando la jornada ya esta completa', async (t) => {
  mockAsistencia(t, [{ tipo: 'entrada' }, { tipo: 'salida' }]);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'salida' } }), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 400);
  assert.ok(res.body.message.includes('ya esta completa'));
  assert.equal(res.body.estado.puedeEntrada, false);
  assert.equal(res.body.estado.puedeSalida, false);
});

test('registrar: registra salida valida tras una entrada y completa la jornada', async (t) => {
  mockAsistencia(t, [{ tipo: 'entrada' }]);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'salida' } }), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.tipo, 'salida');
  assert.equal(res.body.estado.jornadaCompleta, true);
  assert.equal(res.body.estado.puedeEntrada, false);
  assert.equal(res.body.estado.puedeSalida, false);
});

test('registrar: responde 500 ante error de base de datos', async (t) => {
  t.mock.method(Asistencia, 'findAll', async () => {
    throw new Error('connection lost');
  });
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'entrada' } }), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.ok, false);
});

test('estadoActual: devuelve el estado de la jornada del usuario', async (t) => {
  mockAsistencia(t, [{ tipo: 'entrada' }]);
  const res = makeResponse();
  await estadoActual(makeRequest(), res, { ahora: aLas(10) });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.data.puedeEntrada, false);
  assert.equal(res.body.data.puedeSalida, true);
});

test('estadoActual: jornada completa deja todo deshabilitado', async (t) => {
  mockAsistencia(t, [{ tipo: 'entrada' }, { tipo: 'salida' }]);
  const res = makeResponse();
  await estadoActual(makeRequest(), res, { ahora: aLas(10) });
  assert.equal(res.body.data.jornadaCompleta, true);
  assert.equal(res.body.data.puedeEntrada, false);
  assert.equal(res.body.data.puedeSalida, false);
});

test('listarMisAsistencias: devuelve las asistencias del usuario logueado', async (t) => {
  const listado = [{ id: 1, tipo: 'entrada' }, { id: 2, tipo: 'salida' }];
  t.mock.method(Asistencia, 'findAll', async (opts) => {
    assert.equal(opts.where.usuario_id, 1);
    return listado;
  });
  const res = makeResponse();
  await listarMisAsistencias(makeRequest(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.length, 2);
});

test('listarTodas: devuelve todas las asistencias', async (t) => {
  t.mock.method(Asistencia, 'findAll', async () => [{ id: 1, usuario_id: 1 }]);
  const res = makeResponse();
  await listarTodas(makeRequest(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.length, 1);
});
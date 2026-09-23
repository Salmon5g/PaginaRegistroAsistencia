'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { Asistencia } = require('../../src/models');
const { registrar, listarMisAsistencias, listarTodas } = require('../../src/controllers/asistenciaController');

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

test('registrar: rechaza tipo invalido', async () => {
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'otro' } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
  assert.ok(res.body.message.includes('entrada'));
});

test('registrar: registra entrada cuando no hay marcas previas', async (t) => {
  t.mock.method(Asistencia, 'findOne', async () => null);
  const creada = { id: 10, usuario_id: 1, tipo: 'entrada', fecha_hora: new Date() };
  t.mock.method(Asistencia, 'create', async () => creada);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'entrada' } }), res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.data.id, 10);
  assert.equal(res.body.data.tipo, 'entrada');
});

test('registrar: rechaza una segunda entrada el mismo dia', async (t) => {
  t.mock.method(Asistencia, 'findOne', async () => ({ tipo: 'entrada' }));
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'entrada' } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Ya registraste tu entrada hoy. Debes marcar tu salida.');
});

test('registrar: rechaza salida sin entrada previa', async (t) => {
  t.mock.method(Asistencia, 'findOne', async () => null);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'salida' } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Debes marcar tu entrada antes de registrar la salida.');
});

test('registrar: rechaza salida doble (ultima marca tambien salida)', async (t) => {
  t.mock.method(Asistencia, 'findOne', async () => ({ tipo: 'salida' }));
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'salida' } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'Debes marcar tu entrada antes de registrar la salida.');
});

test('registrar: registra salida valida tras una entrada', async (t) => {
  t.mock.method(Asistencia, 'findOne', async () => ({ tipo: 'entrada' }));
  const creada = { id: 11, usuario_id: 1, tipo: 'salida', fecha_hora: new Date() };
  t.mock.method(Asistencia, 'create', async () => creada);
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'salida' } }), res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.tipo, 'salida');
});

test('registrar: responde 500 ante error de base de datos', async (t) => {
  t.mock.method(Asistencia, 'findOne', async () => {
    throw new Error('connection lost');
  });
  const res = makeResponse();
  await registrar(makeRequest({ body: { tipo: 'entrada' } }), res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.ok, false);
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
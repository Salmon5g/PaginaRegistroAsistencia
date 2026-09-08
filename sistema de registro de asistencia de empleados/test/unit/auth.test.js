'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { Usuario } = require('../../src/models');
const { login } = require('../../src/controllers/authController');

process.env.JWT_SECRET = 'secreto-de-prueba';

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
  return { body: {}, ...over };
}

test('login: rechaza si faltan email o password', async () => {
  const res = makeResponse();
  await login(makeRequest(), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
  assert.ok(res.body.message.includes('requeridos'));
});

test('login: rechaza email no registrado', async (t) => {
  t.mock.method(Usuario, 'findOne', async () => null);
  const res = makeResponse();
  await login(makeRequest({ body: { email: 'noexiste@x.cl', password: '123456' } }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Credenciales invalidas.');
});

test('login: rechaza usuario desactivado', async (t) => {
  t.mock.method(Usuario, 'findOne', async () => ({
    id: 1, rol: 'empleado', estado: 'inactivo',
  }));
  const res = makeResponse();
  await login(makeRequest({ body: { email: 'x@x.cl', password: '123456' } }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Usuario desactivado.');
});

test('login: rechaza password incorrecta', async (t) => {
  t.mock.method(Usuario, 'findOne', async () => ({
    id: 1, rol: 'empleado', estado: 'activo',
    validarPassword: async () => false,
  }));
  const res = makeResponse();
  await login(makeRequest({ body: { email: 'x@x.cl', password: 'mala' } }), res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'Credenciales invalidas.');
});

test('login: acepta credenciales validas y genera JWT', async (t) => {
  const usuario = {
    id: 7, rol: 'administrador', estado: 'activo',
    validarPassword: async () => true,
  };
  t.mock.method(Usuario, 'findOne', async () => usuario);
  const res = makeResponse();
  await login(makeRequest({ body: { email: 'admin@x.cl', password: 'secreta' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.ok(res.body.token, 'debe devolver un token');
  const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(payload.id, 7);
  assert.equal(payload.rol, 'administrador');
  assert.equal(res.body.usuario, usuario);
});

test('login: responde 500 ante error inesperado', async (t) => {
  t.mock.method(Usuario, 'findOne', async () => {
    throw new Error('connection lost');
  });
  const res = makeResponse();
  await login(makeRequest({ body: { email: 'x@x.cl', password: '123456' } }), res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.ok, false);
});
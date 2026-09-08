'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { Usuario } = require('../../src/models');
const { crear, listar, obtenerPorId, actualizar, eliminar } = require('../../src/controllers/usuarioController');

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
  return { params: {}, body: {}, ...over };
}

test('crear: rechaza si faltan campos requeridos', async () => {
  const res = makeResponse();
  await crear(makeRequest({ body: { nombre: 'Ana' } }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.ok, false);
});

test('crear: crea un usuario valido y responde 201', async (t) => {
  const nuevo = { id: 3, nombre: 'Ana', email: 'ana@empresa.com', rol: 'empleado', estado: 'activo' };
  t.mock.method(Usuario, 'create', async () => nuevo);
  const res = makeResponse();
  await crear(makeRequest({ body: { nombre: 'Ana', email: 'ana@empresa.com', password: '123456' } }), res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.message, 'Usuario creado.');
  assert.equal(res.body.data.id, 3);
});

test('crear: responde 409 si el email ya esta registrado', async (t) => {
  const dup = new Error('duplicado');
  dup.name = 'SequelizeUniqueConstraintError';
  t.mock.method(Usuario, 'create', async () => {
    throw dup;
  });
  const res = makeResponse();
  await crear(makeRequest({ body: { nombre: 'Ana', email: 'dup@empresa.com', password: '123456' } }), res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.message, 'El email ya esta registrado.');
});

test('crear: responde 500 ante error generico', async (t) => {
  t.mock.method(Usuario, 'create', async () => {
    throw new Error('boom');
  });
  const res = makeResponse();
  await crear(makeRequest({ body: { nombre: 'Ana', email: 'a@empresa.com', password: '123456' } }), res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.ok, false);
});

test('listar: devuelve la lista de usuarios', async (t) => {
  const usuarios = [{ id: 1, nombre: 'Ana' }, { id: 2, nombre: 'Luis' }];
  t.mock.method(Usuario, 'findAll', async () => usuarios);
  const res = makeResponse();
  await listar(makeRequest(), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.length, 2);
});

test('obtenerPorId: responde 404 si no existe', async (t) => {
  t.mock.method(Usuario, 'findByPk', async () => null);
  const res = makeResponse();
  await obtenerPorId(makeRequest({ params: { id: 99 } }), res);
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, 'Usuario no encontrado.');
});

test('obtenerPorId: devuelve el usuario encontrado', async (t) => {
  t.mock.method(Usuario, 'findByPk', async () => ({ id: 5, nombre: 'Ana' }));
  const res = makeResponse();
  await obtenerPorId(makeRequest({ params: { id: 5 } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.id, 5);
});

test('actualizar: responde 404 si el usuario no existe', async (t) => {
  t.mock.method(Usuario, 'findByPk', async () => null);
  const res = makeResponse();
  await actualizar(makeRequest({ params: { id: 99 }, body: { nombre: 'X' } }), res);
  assert.equal(res.statusCode, 404);
});

test('actualizar: actualiza y responde ok', async (t) => {
  const usuario = {
    id: 5, nombre: 'Ana', update: async function (campos) { Object.assign(this, campos); return this; },
  };
  t.mock.method(Usuario, 'findByPk', async () => usuario);
  const res = makeResponse();
  await actualizar(makeRequest({ params: { id: 5 }, body: { nombre: 'Ana Maria' } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.nombre, 'Ana Maria');
});

test('eliminar: desactiva al usuario (baja logica)', async (t) => {
  const usuario = {
    id: 5, estado: 'activo', update: async function (campos) { Object.assign(this, campos); return this; },
  };
  t.mock.method(Usuario, 'findByPk', async () => usuario);
  const res = makeResponse();
  await eliminar(makeRequest({ params: { id: 5 } }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, 'Usuario desactivado.');
  assert.equal(usuario.estado, 'inactivo');
});

test('eliminar: responde 404 si el usuario no existe', async (t) => {
  t.mock.method(Usuario, 'findByPk', async () => null);
  const res = makeResponse();
  await eliminar(makeRequest({ params: { id: 99 } }), res);
  assert.equal(res.statusCode, 404);
});
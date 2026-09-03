'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  esEntradaAtrasada,
  esSalidaAnticipada,
  obtenerEntradasAtrasadas,
  obtenerSalidasAnticipadas,
  obtenerInasistentes,
} = require('../../src/services/reportes');

test('esEntradaAtrasada: 9:30 no es atraso (limite exacto)', () => {
  assert.equal(esEntradaAtrasada(9, 30), false);
});

test('esEntradaAtrasada: 9:31 si es atraso', () => {
  assert.equal(esEntradaAtrasada(9, 31), true);
});

test('esEntradaAtrasada: 10:00 si es atraso', () => {
  assert.equal(esEntradaAtrasada(10, 0), true);
});

test('esEntradaAtrasada: 8:00 no es atraso (antes de 9:30)', () => {
  assert.equal(esEntradaAtrasada(8, 0), false);
});

test('esSalidaAnticipada: 17:30 no es anticipada (limite exacto)', () => {
  assert.equal(esSalidaAnticipada(17, 30), false);
});

test('esSalidaAnticipada: 17:29 si es anticipada', () => {
  assert.equal(esSalidaAnticipada(17, 29), true);
});

test('esSalidaAnticipada: 16:00 si es anticipada', () => {
  assert.equal(esSalidaAnticipada(16, 0), true);
});

test('esSalidaAnticipada: 18:00 no es anticipada (despues de 17:30)', () => {
  assert.equal(esSalidaAnticipada(18, 0), false);
});

test('obtenerEntradasAtrasadas: filtra solo entradas posteriores a 9:30', () => {
  const marcas = [
    { tipo: 'entrada', fecha_hora: '2024-01-01T08:00:00' },
    { tipo: 'entrada', fecha_hora: '2024-01-01T09:30:00' },
    { tipo: 'entrada', fecha_hora: '2024-01-01T09:31:00' },
    { tipo: 'entrada', fecha_hora: '2024-01-01T11:00:00' },
    { tipo: 'salida', fecha_hora: '2024-01-01T18:00:00' },
  ];
  const resultado = obtenerEntradasAtrasadas(marcas);
  assert.equal(resultado.length, 2);
  assert.equal(resultado[0].fecha_hora, '2024-01-01T09:31:00');
  assert.equal(resultado[1].fecha_hora, '2024-01-01T11:00:00');
});

test('obtenerSalidasAnticipadas: filtra solo salidas anteriores a 17:30', () => {
  const marcas = [
    { tipo: 'salida', fecha_hora: '2024-01-01T17:29:00' },
    { tipo: 'salida', fecha_hora: '2024-01-01T17:30:00' },
    { tipo: 'salida', fecha_hora: '2024-01-01T16:00:00' },
    { tipo: 'salida', fecha_hora: '2024-01-01T18:00:00' },
    { tipo: 'entrada', fecha_hora: '2024-01-01T08:00:00' },
  ];
  const resultado = obtenerSalidasAnticipadas(marcas);
  assert.equal(resultado.length, 2);
  assert.equal(resultado[0].fecha_hora, '2024-01-01T17:29:00');
  assert.equal(resultado[1].fecha_hora, '2024-01-01T16:00:00');
});

test('obtenerInasistentes: lista solo usuarios activos sin marcas en la fecha', () => {
  const usuarios = [
    { id: 1, estado: 'activo' },
    { id: 2, estado: 'activo' },
    { id: 3, estado: 'inactivo' },
  ];
  const marcas = [
    { usuario_id: 1, fecha_hora: '2024-01-01T08:30:00' },
    { usuario_id: 2, fecha_hora: '2024-01-02T08:30:00' },
  ];
  const resultado = obtenerInasistentes(usuarios, marcas, '2024-01-01');
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].id, 2);
});

test('obtenerInasistentes: usuario inactivo no se lista aunque no marque', () => {
  const usuarios = [
    { id: 1, estado: 'activo' },
    { id: 2, estado: 'inactivo' },
  ];
  const resultado = obtenerInasistentes(usuarios, [], '2024-01-01');
  assert.equal(resultado.length, 1);
  assert.equal(resultado[0].id, 1);
});

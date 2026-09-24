'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  estadoJornada,
  inicioYFinDelDia,
  instanteEnZona,
  fechaDelDia,
  HORA_INICIO_JORNADA,
  ZONA_JORNADA,
} = require('../../src/services/jornada');

function aLas(hora, minuto = 0, dia = 5) {
  return instanteEnZona(2024, 1, dia, hora, minuto, 0, 0, ZONA_JORNADA);
}

test('estadoJornada: sin marcas y despues del inicio habilita solo entrada', () => {
  const estado = estadoJornada([], { ahora: aLas(10) });
  assert.equal(estado.puedeEntrada, true);
  assert.equal(estado.puedeSalida, false);
  assert.equal(estado.jornadaCompleta, false);
});

test('estadoJornada: sin marcas y antes del inicio deshabilita todo', () => {
  const estado = estadoJornada([], { ahora: aLas(8) });
  assert.equal(estado.puedeEntrada, false);
  assert.equal(estado.puedeSalida, false);
  assert.ok(estado.texto.includes('comienza'));
});

test('estadoJornada: exactamente en la hora de inicio se habilita la entrada', () => {
  const estado = estadoJornada([], { ahora: aLas(HORA_INICIO_JORNADA.hora, HORA_INICIO_JORNADA.minuto) });
  assert.equal(estado.puedeEntrada, true);
});

test('estadoJornada: con entrada pendiente habilita solo salida', () => {
  const estado = estadoJornada([{ tipo: 'entrada' }], { ahora: aLas(10) });
  assert.equal(estado.puedeEntrada, false);
  assert.equal(estado.puedeSalida, true);
  assert.equal(estado.jornadaCompleta, false);
});

test('estadoJornada: jornada completa deshabilita ambos y marca jornadaCompleta', () => {
  const estado = estadoJornada([{ tipo: 'entrada' }, { tipo: 'salida' }], { ahora: aLas(10) });
  assert.equal(estado.puedeEntrada, false);
  assert.equal(estado.puedeSalida, false);
  assert.equal(estado.jornadaCompleta, true);
  assert.ok(estado.texto.includes('manana'));
});

test('estadoJornada: la fecha y la hora de inicio se calculan en la zona de jornadas', () => {
  const estado = estadoJornada([], { ahora: aLas(10) });
  assert.equal(estado.fecha, '2024-01-05');
  assert.equal(estado.hora_inicio, '09:30');
});

test('estadoJornada: con entradas duplicadas solo cuenta una jornada', () => {
  const estado = estadoJornada([{ tipo: 'entrada' }, { tipo: 'entrada' }], { ahora: aLas(10) });
  assert.equal(estado.puedeSalida, true);
  assert.equal(estado.jornadaCompleta, false);
});

test('inicioYFinDelDia: encierra el instante de referencia', () => {
  const ahora = aLas(10, 30);
  const { inicio, fin } = inicioYFinDelDia(ahora);
  assert.ok(inicio <= ahora, 'inicio debe ser <= ahora');
  assert.ok(ahora <= fin, 'ahora debe ser <= fin');
});

test('inicioYFinDelDia: el dia abarca 24h exactas menos un milisegundo', () => {
  const ahora = aLas(12, 0, 10);
  const { inicio, fin } = inicioYFinDelDia(ahora);
  const diffMs = fin.getTime() - inicio.getTime();
  assert.equal(diffMs, 24 * 60 * 60 * 1000 - 1);
});

test('inicioYFinDelDia: dias estables de verano e invierno duran 24h', () => {
  // Enero en Santiago es horario de verano (UTC-3); julio es invierno (UTC-4).
  const deVerano = inicioYFinDelDia(instanteEnZona(2024, 0, 1, 10, 0, 0, 0, ZONA_JORNADA));
  const deInvierno = inicioYFinDelDia(instanteEnZona(2024, 6, 15, 10, 0, 0, 0, ZONA_JORNADA));
  assert.equal(deVerano.fin - deVerano.inicio, 24 * 60 * 60 * 1000 - 1);
  assert.equal(deInvierno.fin - deInvierno.inicio, 24 * 60 * 60 * 1000 - 1);
});

test('fechaDelDia: respeta la zona de jornadas para el limite de medianoche', () => {
  // 2024-01-01 01:00 UTC+0 == 2023-12-31 22:00 en Santiago (UTC-3).
  const entradaUtc = new Date(Date.UTC(2024, 0, 1, 1, 0, 0));
  assert.equal(fechaDelDia(entradaUtc, 'America/Santiago'), '2023-12-31');
});
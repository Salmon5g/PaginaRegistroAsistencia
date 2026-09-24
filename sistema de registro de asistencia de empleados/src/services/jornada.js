/**
 * @file Servicio de la jornada laboral.
 * Centraliza la logica de las jornadas de asistencia (una entrada y una
 * salida por dia en el calendario de Chile) para que el registro este
 * validado server-side y el frontend solo refleje el estado devuelto.
 * @module services/jornada
 */

'use strict';

const { CONFIG: REPORTES_CONFIG, ZONA_REPORTES, partesEn } = require('./reportes');

/**
 * Hora de inicio de la jornada laboral. Coincide con el umbral de atraso
 * (9:30): antes de esa hora no se habilitan las marcas del dia.
 * @type {{hora: number, minuto: number}}
 */
const HORA_INICIO_JORNADA = REPORTES_CONFIG.HORA_ATRASO;

/**
 * Zona horaria en la que se define cada jornada (calendario chileno).
 * @type {string}
 */
const ZONA_JORNADA = ZONA_REPORTES;

/**
 * Calcula el offset (en milisegundos) entre UTC y la zona horaria indicada
 * para un instante dado, teniendo en cuenta el horario de verano.
 * @param {Date} d - Instante absoluto.
 * @param {string} timeZone - Zona horaria IANA.
 * @returns {number} Offset en milisegundos (positive este de UTC si el
 * formato de DateTimeFormat devuelve una hora mayor).
 */
function offsetEnZona(d, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = {};
  for (const { type, value } of fmt.formatToParts(d)) {
    if (type !== 'literal') parts[type] = Number(value);
  }
  const comoUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour % 24,
    parts.minute,
    parts.second,
  );
  return comoUtc - d.getTime();
}

/**
 * Convierte una fecha/hora del calendario local de una zona horaria en un
 * instante absoluto (Date), corrigiendo iterativamente el offset para ser
 * exacto incluso en los cambios de horario de verano.
 * @param {number} year - Anio (calendario de la zona).
 * @param {number} month - Mes (1-12).
 * @param {number} day - Dia.
 * @param {number} hour - Hora (0-23).
 * @param {number} minute - Minutos.
 * @param {number} second - Segundos.
 * @param {number} millisecond - Milisegundos.
 * @param {string} timeZone - Zona horaria IANA.
 * @returns {Date}
 */
function instanteEnZona(year, month, day, hour, minute, second, millisecond, timeZone) {
  const deseado = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  let estimado = new Date(deseado);
  for (let i = 0; i < 8; i++) {
    // El offset se calcula solo con precision de segundos (el formato no
    // muestra milisegundos); redondeamos la estimacion al segundo para que
    // el ajuste no arrastre milisegundos espurios.
    const redondeado = new Date(Math.floor(estimado.getTime() / 1000) * 1000);
    const corregido = new Date(deseado - offsetEnZona(redondeado, timeZone));
    if (Math.abs(corregido.getTime() - estimado.getTime()) < 2000) return corregido;
    estimado = corregido;
  }
  return estimado;
}

/**
 * Devuelve el inicio y el fin del dia calendario (00:00:00.000 -
 * 23:59:59.999) en la zona horaria de las jornadas, como instantes
 * absolutos aptos para filtrar en la base de datos.
 * @param {Date} [ahora] - Instante de referencia (por defecto, el actual).
 * @param {string} [timeZone] - Zona horaria del calendario.
 * @returns {{inicio: Date, fin: Date}}
 */
function inicioYFinDelDia(ahora = new Date(), timeZone = ZONA_JORNADA) {
  const p = partesEn(ahora, timeZone);
  return {
    inicio: instanteEnZona(p.year, p.month, p.day, 0, 0, 0, 0, timeZone),
    fin: instanteEnZona(p.year, p.month, p.day, 23, 59, 59, 999, timeZone),
  };
}

/**
 * Indica si la hora actual es anterior a la hora de inicio de la jornada.
 * @param {Date} ahora - Instante a evaluar.
 * @param {{hora: number, minuto: number}} horaInicio - Hora de inicio.
 * @param {string} [timeZone] - Zona horaria.
 * @returns {boolean}
 */
function esAntesDelInicio(ahora, horaInicio = HORA_INICIO_JORNADA, timeZone = ZONA_JORNADA) {
  const p = partesEn(ahora, timeZone);
  return p.hour < horaInicio.hora || (p.hour === horaInicio.hora && p.minute < horaInicio.minuto);
}

/**
 * Fecha de una jornada (YYYY-MM-DD en la zona de las jornadas), usada
 * como clave de "hoy".
 * @param {Date} [ahora] - Instante de referencia.
 * @param {string} [timeZone] - Zona horaria.
 * @returns {string}
 */
function fechaDelDia(ahora = new Date(), timeZone = ZONA_JORNADA) {
  const p = partesEn(ahora, timeZone);
  const pad = (n) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * Calcula el estado de la jornada de un usuario a partir de sus marcas del
 * dia. Es la unica fuente de verdad para habilitar/deshabilitar los botones
 * de registro de entrada y salida:
 *
 * - Si ya hay una salida -> jornada completa: nada mas se puede registrar.
 * - Si ya hay una entrada (sin salida) -> solo se habilita la salida.
 * - Sin marcas y antes de la hora de inicio -> todo deshabilitado.
 * - Sin marcas y despues del inicio -> solo se habilita la entrada.
 *
 * @param {Array<{tipo: string}>} marcas - Marcas del dia del usuario.
 * @param {object} [opts]
 * @param {Date} [opts.ahora] - Instante de referencia.
 * @param {{hora: number, minuto: number}} [opts.horaInicio] - Hora de inicio de jornada.
 * @param {string} [opts.timeZone] - Zona horaria.
 * @returns {{fecha: string, hora_inicio: string, puedeEntrada: boolean, puedeSalida: boolean, hayEntrada: boolean, haySalida: boolean, jornadaCompleta: boolean, texto: string}}
 */
function estadoJornada(marcas, opts = {}) {
  const ahora = opts.ahora || new Date();
  const horaInicio = opts.horaInicio || HORA_INICIO_JORNADA;
  const timeZone = opts.timeZone || ZONA_JORNADA;
  const fecha = fechaDelDia(ahora, timeZone);
  const horaInicioTexto = `${String(horaInicio.hora).padStart(2, '0')}:${String(horaInicio.minuto).padStart(2, '0')}`;

  const hayEntrada = marcas.some((m) => m.tipo === 'entrada');
  const haySalida = marcas.some((m) => m.tipo === 'salida');

  if (haySalida) {
    return {
      fecha,
      hora_inicio: horaInicioTexto,
      puedeEntrada: false,
      puedeSalida: false,
      hayEntrada: true,
      haySalida: true,
      jornadaCompleta: true,
      texto: `Jornada completada. Los registros se habilitan nuevamente manana a las ${horaInicioTexto}.`,
    };
  }
  if (hayEntrada) {
    return {
      fecha,
      hora_inicio: horaInicioTexto,
      puedeEntrada: false,
      puedeSalida: true,
      hayEntrada: true,
      haySalida: false,
      jornadaCompleta: false,
      texto: 'Entrada registrada. Ahora marca tu salida.',
    };
  }
  if (esAntesDelInicio(ahora, horaInicio, timeZone)) {
    return {
      fecha,
      hora_inicio: horaInicioTexto,
      puedeEntrada: false,
      puedeSalida: false,
      hayEntrada: false,
      haySalida: false,
      jornadaCompleta: false,
      texto: `La jornada de hoy comienza a las ${horaInicioTexto}. Los registros se habilitan a esa hora.`,
    };
  }
  return {
    fecha,
    hora_inicio: horaInicioTexto,
    puedeEntrada: true,
    puedeSalida: false,
    hayEntrada: false,
    haySalida: false,
    jornadaCompleta: false,
    texto: 'Aun no has marcado tu entrada.',
  };
}

module.exports = {
  HORA_INICIO_JORNADA,
  ZONA_JORNADA,
  offsetEnZona,
  instanteEnZona,
  inicioYFinDelDia,
  esAntesDelInicio,
  fechaDelDia,
  estadoJornada,
};
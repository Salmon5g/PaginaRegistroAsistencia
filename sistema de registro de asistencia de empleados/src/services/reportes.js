'use strict';

const CONFIG = {
  HORA_ATRASO: { hora: 9, minuto: 30 },
  HORA_SALIDA_ANTICIPADA: { hora: 17, minuto: 30 },
};

/**
 * Zona horaria de los reportes: la empresa opera en horario chileno.
 * America/Santiago maneja automaticamente el cambio entre UTC-3 (verano)
 * y UTC-4 (invierno).
 */
const ZONA_REPORTES = 'America/Santiago';

/**
 * Zona horaria por defecto del proceso (se usa cuando no se indica una).
 * Mantiene el comportamiento historico de las pruebas unitarias.
 */
const ZONA_POR_DEFECTO = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function comoFecha(fecha) {
  return fecha instanceof Date ? fecha : new Date(fecha);
}

/**
 * Extrae los componentes de fecha/hora de un instante expresado en una
 * zona horaria concreta (p.ej. America/Santiago), manejando el horario
 * de verano el cual cambia el offset UTC-3/UTC-4.
 * @param {Date|string} fecha - Instante absoluto.
 * @param {string} timeZone - Zona horaria de destino (IANA).
 * @returns {{year: number, month: number, day: number, hour: number, minute: number}}
 */
function partesEn(fecha, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = {};
  for (const p of fmt.formatToParts(comoFecha(fecha))) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
}

/**
 * Devuelve la fecha de un instante en formato YYYY-MM-DD según la zona horaria indicada.
 * @param {Date|string} fecha - Instante absoluto.
 * @param {string} timeZone - Zona horaria de destino (IANA).
 * @returns {string}
 */
function fechaTexto(fecha, timeZone) {
  const p = partesEn(fecha, timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/**
 * Devuelve la fecha y hora de un instante en formato YYYY-MM-DD HH:mm según
 * la zona horaria indicada.
 * @param {Date|string} fecha - Instante absoluto.
 * @param {string} timeZone - Zona horaria de destino (IANA).
 * @returns {string}
 */
function fechaHoraTexto(fecha, timeZone) {
  const p = partesEn(fecha, timeZone);
  return `${fechaTexto(fecha, timeZone)} ${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

/**
 * Determina si una hora representa una entrada atrasada.
 * Se considera "entrada atrasada" toda entrada posterior a las 9:30 am
 * (hora local de Chile).
 * @param {number} hora - Hora del dia (0-23).
 * @param {number} minuto - Minuto del dia (0-59).
 * @returns {boolean}
 */
function esEntradaAtrasada(hora, minuto) {
  const { hora: h, minuto: m } = CONFIG.HORA_ATRASO;
  return hora > h || (hora === h && minuto > m);
}

/**
 * Determina si una hora representa una salida anticipada.
 * Se considera "salida anticipada" toda salida anterior a las 17:30
 * (hora local de Chile).
 * @param {number} hora - Hora del dia (0-23).
 * @param {number} minuto - Minuto del dia (0-59).
 * @returns {boolean}
 */
function esSalidaAnticipada(hora, minuto) {
  const { hora: h, minuto: m } = CONFIG.HORA_SALIDA_ANTICIPADA;
  return hora < h || (hora === h && minuto < m);
}

/**
 * Filtra las entradas de un listado de marcas para quedarse unicamente
 * con las que representan entradas atrasadas en la zona horaria indicada.
 * @param {Array<{tipo: string, fecha_hora: Date|string}>} marcas
 * @param {string} [timeZone] - Zona horaria de evaluacion (por defecto, la del proceso).
 * @returns {Array}
 */
function obtenerEntradasAtrasadas(marcas, timeZone = ZONA_POR_DEFECTO) {
  return marcas.filter((m) => {
    if (m.tipo !== 'entrada') return false;
    const p = partesEn(m.fecha_hora, timeZone);
    return esEntradaAtrasada(p.hour, p.minute);
  });
}

/**
 * Filtra las salidas de un listado de marcas para quedarse unicamente
 * con las que representan salidas anticipadas en la zona horaria indicada.
 * @param {Array<{tipo: string, fecha_hora: Date|string}>} marcas
 * @param {string} [timeZone] - Zona horaria de evaluacion (por defecto, la del proceso).
 * @returns {Array}
 */
function obtenerSalidasAnticipadas(marcas, timeZone = ZONA_POR_DEFECTO) {
  return marcas.filter((m) => {
    if (m.tipo !== 'salida') return false;
    const p = partesEn(m.fecha_hora, timeZone);
    return esSalidaAnticipada(p.hour, p.minute);
  });
}

/**
 * Obtiene los usuarios activos que no registraron ninguna marca (entrada o
 * salida) en una fecha determinada (según el calendario de la zona indicada).
 * @param {Array<{estado: string, id: number}>} usuarios - Usuarios del sistema.
 * @param {Array<{usuario_id: number, fecha_hora: Date|string}>} marcas - Todas las marcas.
 * @param {string} fecha - Fecha en formato YYYY-MM-DD a evaluar.
 * @param {string} [timeZone] - Zona horaria del calendario (por defecto, la del proceso).
 * @returns {Array}
 */
function obtenerInasistentes(usuarios, marcas, fecha, timeZone = ZONA_POR_DEFECTO) {
  const marcaron = new Set();

  for (const m of marcas) {
    if (fechaTexto(m.fecha_hora, timeZone) === fecha) {
      marcaron.add(String(m.usuario_id));
    }
  }

  return usuarios.filter((u) => u.estado === 'activo' && !marcaron.has(String(u.id)));
}

module.exports = {
  CONFIG,
  ZONA_REPORTES,
  ZONA_POR_DEFECTO,
  partesEn,
  fechaTexto,
  fechaHoraTexto,
  esEntradaAtrasada,
  esSalidaAnticipada,
  obtenerEntradasAtrasadas,
  obtenerSalidasAnticipadas,
  obtenerInasistentes,
};
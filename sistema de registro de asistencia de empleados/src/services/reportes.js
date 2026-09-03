'use strict';

const CONFIG = {
  HORA_ATRASO: { hora: 9, minuto: 30 },
  HORA_SALIDA_ANTICIPADA: { hora: 17, minuto: 30 },
};

/**
 * Determina si una hora representa una entrada atrasada.
 * Se considera "entrada atrasada" toda entrada posterior a las 9:30 am.
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
 * Se considera "salida anticipada" toda salida anterior a las 17:30.
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
 * con las que representan entradas atrasadas.
 * @param {Array<{tipo: string, fecha_hora: Date|string}>} marcas
 * @returns {Array}
 */
function obtenerEntradasAtrasadas(marcas) {
  return marcas.filter((m) => {
    if (m.tipo !== 'entrada') return false;
    const fecha = m.fecha_hora instanceof Date ? m.fecha_hora : new Date(m.fecha_hora);
    return esEntradaAtrasada(fecha.getHours(), fecha.getMinutes());
  });
}

/**
 * Filtra las salidas de un listado de marcas para quedarse unicamente
 * con las que representan salidas anticipadas.
 * @param {Array<{tipo: string, fecha_hora: Date|string}>} marcas
 * @returns {Array}
 */
function obtenerSalidasAnticipadas(marcas) {
  return marcas.filter((m) => {
    if (m.tipo !== 'salida') return false;
    const fecha = m.fecha_hora instanceof Date ? m.fecha_hora : new Date(m.fecha_hora);
    return esSalidaAnticipada(fecha.getHours(), fecha.getMinutes());
  });
}

/**
 * Obtiene los usuarios activos que no registraron ninguna marca (entrada o
 * salida) en una fecha determinada.
 * @param {Array<{estado: string, id: number}>} usuarios - Usuarios del sistema.
 * @param {Array<{usuario_id: number, fecha_hora: Date|string}>} marcas - Todas las marcas.
 * @param {string} fecha - Fecha en formato YYYY-MM-DD a evaluar.
 * @returns {Array}
 */
function obtenerInasistentes(usuarios, marcas, fecha) {
  const fechaObj = new Date(`${fecha}T00:00:00`);
  const inicio = new Date(fechaObj);
  const fin = new Date(fechaObj);
  fin.setDate(fin.getDate() + 1);

  const marcaron = new Set();

  for (const m of marcas) {
    const momento = m.fecha_hora instanceof Date ? m.fecha_hora : new Date(m.fecha_hora);
    if (momento >= inicio && momento < fin) {
      marcaron.add(String(m.usuario_id));
    }
  }

  return usuarios.filter((u) => u.estado === 'activo' && !marcaron.has(String(u.id)));
}

module.exports = {
  CONFIG,
  esEntradaAtrasada,
  esSalidaAnticipada,
  obtenerEntradasAtrasadas,
  obtenerSalidasAnticipadas,
  obtenerInasistentes,
};

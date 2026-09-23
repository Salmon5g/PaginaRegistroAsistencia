/**
 * @file Controlador de reportes administrativos: atrasos, salidas
 * anticipadas e inasistencias. Requiere privilegios de administrador.
 * @module controllers/reporteController
 *
 * NOTA: Todos los umbrales horarios (9:30 / 17:30) y los rangos de fecha
 * (`desde`/`hasta`/`fecha`) se evaluan en la zona horaria de Chile
 * (America/Santiago), por lo que los datos se traen de la BD en UTC y se
 * convierten antes de clasificar y de formatear las fechas del reporte.
 */

'use strict';
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const {
  ZONA_REPORTES,
  fechaTexto,
  fechaHoraTexto,
  obtenerEntradasAtrasadas,
  obtenerSalidasAnticipadas,
  obtenerInasistentes,
} = require('../services/reportes');
const { generarPdf } = require('../services/pdfReportes');

function responderPdf(req, res, tipo, data, meta) {
  if (req.query.formato !== 'pdf') return false;
  generarPdf(tipo, data, meta)
    .then((buffer) => {
      const fecha = fechaTexto(new Date(), ZONA_REPORTES);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_${tipo}_${fecha}.pdf"`);
      res.end(buffer);
    })
    .catch(() => {
      res.status(500).json({ ok: false, message: 'Error al generar el PDF.' });
    });
  return true;
}

/**
 * Agrupa una lista de marcas por usuario y produce los resúmenes de incidencias
 * (total y fechas) tal como se sirven en el JSON y el PDF.
 * @param {Array} incidentes - Marcas ya clasificadas como incidencia.
 * @param {string} totalKey - Clave del total (p.ej. `total_atrasos`).
 * @param {string} fechasKey - Clave de las fechas (p.ej. `fechas_atraso`).
 * @returns {Array}
 */
function resumenPorUsuario(incidentes, totalKey, fechasKey) {
  const porUsuario = new Map();
  for (const m of incidentes) {
    if (!porUsuario.has(m.usuario_id)) {
      porUsuario.set(m.usuario_id, {
        usuario_id: m.usuario_id,
        nombre: m.nombre,
        email: m.email,
        [totalKey]: 0,
        [fechasKey]: [],
      });
    }
    const e = porUsuario.get(m.usuario_id);
    e[totalKey] += 1;
    e[fechasKey].push(fechaHoraTexto(m.fecha_hora, ZONA_REPORTES));
  }
  return [...porUsuario.values()]
    .map((e) => ({ ...e, [fechasKey]: e[fechasKey].join(',') }))
    .sort((a, b) => b[totalKey] - a[totalKey]);
}

/**
 * Genera un reporte de entradas atrasadas (posteriores a las 9:30 am hora
 * de Chile), agrupado por usuario, con el total de atrasos y las fechas en
 * que ocurrieron. Puede filtrarse por rango de fechas (horario chileno).
 * @async
 * @function reporteAtrasos
 * @param {import('express').Request} req - Peticion HTTP. `req.query` puede contener `{ desde, hasta }` en formato `YYYY-MM-DD`.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Responde con `{ ok, data }` (200), donde cada elemento de
 * `data` tiene `{ usuario_id, nombre, email, total_atrasos, fechas_atraso }`,
 * o `{ ok, message }` (500) ante error.
 */
const reporteAtrasos = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const marcas = await sequelize.query(
      `SELECT a.usuario_id, a.tipo, a.fecha_hora, u.nombre, u.email
       FROM asistencias a
       INNER JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.tipo = 'entrada'
       ORDER BY a.fecha_hora ASC, a.id ASC`,
      { type: QueryTypes.SELECT }
    );

    let atrasadas = obtenerEntradasAtrasadas(marcas, ZONA_REPORTES);
    if (desde) atrasadas = atrasadas.filter((m) => fechaTexto(m.fecha_hora, ZONA_REPORTES) >= desde);
    if (hasta) atrasadas = atrasadas.filter((m) => fechaTexto(m.fecha_hora, ZONA_REPORTES) <= hasta);

    const resultados = resumenPorUsuario(atrasadas, 'total_atrasos', 'fechas_atraso');

    if (responderPdf(req, res, 'atrasos', resultados, { desde, hasta })) return;
    res.json({ ok: true, data: resultados });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de atrasos.' });
  }
};

/**
 * Genera un reporte de salidas anticipadas (anteriores a las 5:30 pm hora de
 * Chile), agrupado por usuario, con el total de salidas anticipadas y las
 * fechas en que ocurrieron. Puede filtrarse por rango de fechas (horario chileno).
 * @async
 * @function reporteSalidasAnticipadas
 * @param {import('express').Request} req - Peticion HTTP. `req.query` puede contener `{ desde, hasta }` en formato `YYYY-MM-DD`.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Responde con `{ ok, data }` (200), donde cada elemento de
 * `data` tiene `{ usuario_id, nombre, email, total_salidas_anticipadas, fechas_salida }`,
 * o `{ ok, message }` (500) ante error.
 */
const reporteSalidasAnticipadas = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    const marcas = await sequelize.query(
      `SELECT a.usuario_id, a.tipo, a.fecha_hora, u.nombre, u.email
       FROM asistencias a
       INNER JOIN usuarios u ON u.id = a.usuario_id
       WHERE a.tipo = 'salida'
       ORDER BY a.fecha_hora ASC, a.id ASC`,
      { type: QueryTypes.SELECT }
    );

    let anticipadas = obtenerSalidasAnticipadas(marcas, ZONA_REPORTES);
    if (desde) anticipadas = anticipadas.filter((m) => fechaTexto(m.fecha_hora, ZONA_REPORTES) >= desde);
    if (hasta) anticipadas = anticipadas.filter((m) => fechaTexto(m.fecha_hora, ZONA_REPORTES) <= hasta);

    const resultados = resumenPorUsuario(anticipadas, 'total_salidas_anticipadas', 'fechas_salida');

    if (responderPdf(req, res, 'salidas', resultados, { desde, hasta })) return;
    res.json({ ok: true, data: resultados });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de salidas anticipadas.' });
  }
};

/**
 * Genera un reporte de inasistencias para una fecha específica (calendario
 * chileno), mostrando los usuarios que no registraron asistencia.
 * @async
 * @function reporteInasistencias
 * @param {import('express').Request} req - Peticion HTTP. `req.query` puede contener `{ fecha }` en formato `YYYY-MM-DD`.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Responde con `{ ok, fecha, data }` (200), donde cada elemento de
 * `data` tiene `{ usuario_id, nombre, email }`, o `{ ok, message }` (500) ante error.
 */
const reporteInasistencias = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || fechaTexto(new Date(), ZONA_REPORTES);

    const usuarios = await sequelize.query(
      'SELECT id, nombre, email, estado FROM usuarios ORDER BY nombre ASC',
      { type: QueryTypes.SELECT }
    );

    const marcas = await sequelize.query(
      'SELECT usuario_id, fecha_hora FROM asistencias',
      { type: QueryTypes.SELECT }
    );

    const resultado = obtenerInasistentes(usuarios, marcas, fechaConsulta, ZONA_REPORTES)
      .map((u) => ({ usuario_id: u.id, nombre: u.nombre, email: u.email }));

    if (responderPdf(req, res, 'inasistencias', resultado, { fecha: fechaConsulta })) return;
    res.json({ ok: true, fecha: fechaConsulta, data: resultado });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de inasistencias.' });
  }
};

module.exports = { reporteAtrasos, reporteSalidasAnticipadas, reporteInasistencias };
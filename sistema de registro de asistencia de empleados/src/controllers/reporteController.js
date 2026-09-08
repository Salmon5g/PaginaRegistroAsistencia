/**
 * @file Controlador de reportes administrativos: atrasos, salidas
 * anticipadas e inasistencias. Requiere privilegios de administrador.
 * @module controllers/reporteController
 *
 * NOTA: `reporteAtrasos` y `reporteSalidasAnticipadas` interpolan los
 * parametros de query `desde`/`hasta` directamente en el SQL. Se documenta
 * tal como esta, pero conviene parametrizar esos valores para evitar
 * inyeccion SQL.
 */

'use strict';
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const { obtenerInasistentes } = require('../services/reportes');
const { generarPdf } = require('../services/pdfReportes');

function responderPdf(req, res, tipo, data, meta) {
  if (req.query.formato !== 'pdf') return false;
  generarPdf(tipo, data, meta)
    .then((buffer) => {
      const fecha = new Date().toISOString().slice(0, 10);
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
 * Genera un reporte de entradas atrasadas (posteriores a las 9:30 am),
 * agrupado por usuario, con el total de atrasos y las fechas en que
 * ocurrieron. Puede filtrarse por rango de fechas.
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

    let whereClause = "WHERE a.tipo = 'entrada' AND (HOUR(a.fecha_hora) > 9 OR (HOUR(a.fecha_hora) = 9 AND MINUTE(a.fecha_hora) > 30))";
    if (desde) whereClause += ` AND DATE(a.fecha_hora) >= '${desde}'`;
    if (hasta) whereClause += ` AND DATE(a.fecha_hora) <= '${hasta}'`;

    const resultados = await sequelize.query(`
      SELECT
        u.id AS usuario_id,
        u.nombre,
        u.email,
        COUNT(a.id) AS total_atrasos,
        GROUP_CONCAT(DATE_FORMAT(a.fecha_hora, '%Y-%m-%d %H:%i') ORDER BY a.fecha_hora) AS fechas_atraso
      FROM asistencias a
      INNER JOIN usuarios u ON u.id = a.usuario_id
      ${whereClause}
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total_atrasos DESC
    `, { type: QueryTypes.SELECT });

    if (responderPdf(req, res, 'atrasos', resultados, { desde, hasta })) return;
    res.json({ ok: true, data: resultados });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de atrasos.' });
  }
};

/**
 * Genera un reporte de salidas anticipadas (anteriores a las 5:30 pm),
 * agrupado por usuario, con el total de salidas anticipadas y las fechas en que
 * ocurrieron. Puede filtrarse por rango de fechas.
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

    let whereClause = "WHERE a.tipo = 'salida' AND (HOUR(a.fecha_hora) < 17 OR (HOUR(a.fecha_hora) = 17 AND MINUTE(a.fecha_hora) < 30))";
    if (desde) whereClause += ` AND DATE(a.fecha_hora) >= '${desde}'`;
    if (hasta) whereClause += ` AND DATE(a.fecha_hora) <= '${hasta}'`;

    const resultados = await sequelize.query(`
      SELECT
        u.id AS usuario_id,
        u.nombre,
        u.email,
        COUNT(a.id) AS total_salidas_anticipadas,
        GROUP_CONCAT(DATE_FORMAT(a.fecha_hora, '%Y-%m-%d %H:%i') ORDER BY a.fecha_hora) AS fechas_salida
      FROM asistencias a
      INNER JOIN usuarios u ON u.id = a.usuario_id
      ${whereClause}
      GROUP BY u.id, u.nombre, u.email
      ORDER BY total_salidas_anticipadas DESC
    `, { type: QueryTypes.SELECT });

    if (responderPdf(req, res, 'salidas', resultados, { desde, hasta })) return;
    res.json({ ok: true, data: resultados });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de salidas anticipadas.' });
  }
};

/**
 * Genera un reporte de inasistencias para una fecha específica,
 * mostrando los usuarios que no registraron asistencia.
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
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    const usuarios = await sequelize.query(
      'SELECT id, nombre, email, estado FROM usuarios ORDER BY nombre ASC',
      { type: QueryTypes.SELECT }
    );

    const marcas = await sequelize.query(
      'SELECT usuario_id, fecha_hora FROM asistencias',
      { type: QueryTypes.SELECT }
    );

    const resultado = obtenerInasistentes(usuarios, marcas, fechaConsulta)
      .map((u) => ({ usuario_id: u.id, nombre: u.nombre, email: u.email }));

    if (responderPdf(req, res, 'inasistencias', resultado, { fecha: fechaConsulta })) return;
    res.json({ ok: true, fecha: fechaConsulta, data: resultado });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de inasistencias.' });
  }
};

module.exports = { reporteAtrasos, reporteSalidasAnticipadas, reporteInasistencias };

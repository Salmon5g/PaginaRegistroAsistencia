'use strict';
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');

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

    res.json({ ok: true, data: resultados });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de atrasos.' });
  }
};

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

    res.json({ ok: true, data: resultados });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de salidas anticipadas.' });
  }
};

const reporteInasistencias = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || new Date().toISOString().split('T')[0];

    const resultados = await sequelize.query(`
      SELECT
        u.id AS usuario_id,
        u.nombre,
        u.email
      FROM usuarios u
      WHERE u.estado = 'activo'
        AND u.id NOT IN (
          SELECT a.usuario_id
          FROM asistencias a
          WHERE DATE(a.fecha_hora) = :fecha
        )
      ORDER BY u.nombre ASC
    `, {
      replacements: { fecha: fechaConsulta },
      type: QueryTypes.SELECT,
    });

    res.json({ ok: true, fecha: fechaConsulta, data: resultados });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al generar reporte de inasistencias.' });
  }
};

module.exports = { reporteAtrasos, reporteSalidasAnticipadas, reporteInasistencias };

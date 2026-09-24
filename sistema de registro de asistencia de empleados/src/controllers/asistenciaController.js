/**
 * @file Controlador de registro y consulta de asistencias (marcas de
 * entrada/salida).
 * @module controllers/asistenciaController
 */

'use strict';
const { Asistencia, Usuario } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { estadoJornada, inicioYFinDelDia } = require('../services/jornada');

/**
 * Obtiene el estado actual de la jornada del usuario autenticado,
 * consultando sus marcas del dia (calendario de Chile).
 * @param {number} usuario_id - Id del usuario.
 * @param {Date} [ahora] - Instante de referencia para la jornada "de hoy".
 * @returns {Promise<object>} Estado de la jornada (fuente de verdad).
 */
async function estadoDeJornadaDe(usuario_id, ahora = new Date()) {
  const { inicio, fin } = inicioYFinDelDia(ahora);
  const marcas = await Asistencia.findAll({
    where: {
      usuario_id,
      fecha_hora: { [Op.between]: [inicio, fin] },
    },
  });
  return estadoJornada(marcas, { ahora });
}

/**
 * Registra una marca de entrada o salida para el usuario autenticado.
 * En cada jornada (dia en el calendario de Chile) solo se permite una
 * entrada y, tras ella, una salida. Una vez completa la jornada, no se
 * acepta ninguna marca mas; los botones se habilitan recien al dia
 * siguiente a la hora de inicio de la jornada.
 * @name registrar
 * @function
 * @param {object} [opts={}]
 * @param {Date} [opts.ahora] - Instante de referencia (inyectable para pruebas).
 */
const registrar = async (req, res, opts = {}) => {
  try {
    const { tipo } = req.body;
    const usuario_id = req.usuario.id;
    const ahora = opts.ahora || new Date();

    if (!tipo || !['entrada', 'salida'].includes(tipo)) {
      return res.status(400).json({ ok: false, message: 'Tipo debe ser "entrada" o "salida".' });
    }

    const estado = await estadoDeJornadaDe(usuario_id, ahora);

    if (tipo === 'entrada') {
      if (estado.hayEntrada) {
        return res.status(400).json({
          ok: false,
          message: 'Ya registraste tu entrada hoy. Solo puedes marcar una entrada por jornada.',
          estado,
        });
      }
      if (!estado.puedeEntrada) {
        return res.status(400).json({
          ok: false,
          message: `Aun no puedes marcar tu entrada. La jornada comienza a las ${estado.hora_inicio}.`,
          estado,
        });
      }
    } else {
      if (!estado.hayEntrada) {
        return res.status(400).json({
          ok: false,
          message: 'Debes marcar tu entrada antes de registrar la salida.',
          estado,
        });
      }
      if (estado.jornadaCompleta) {
        return res.status(400).json({
          ok: false,
          message: 'Tu jornada de hoy ya esta completa. Los registros se habilitan nuevamente manana.',
          estado,
        });
      }
    }

    const asistencia = await Asistencia.create({
      usuario_id,
      tipo,
      fecha_hora: ahora,
    });

    const estadoFinalizado = await estadoDeJornadaDe(usuario_id, ahora);
    res.status(201).json({
      ok: true,
      message: `${tipo} registrada.`,
      data: asistencia,
      estado: estadoFinalizado,
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al registrar asistencia.' });
  }
};

/**
 * Devuelve el estado de la jornada del usuario autenticado, calculado en el
 * backend (fuente de verdad). El frontend lo consulta al cargar la pantalla
 * y tras cada operacion para habilitar/deshabilitar los botones.
 * @name estadoActual
 * @function
 * @param {object} [opts={}]
 * @param {Date} [opts.ahora] - Instante de referencia (inyectable para pruebas).
 */
const estadoActual = async (req, res, opts = {}) => {
  try {
    const ahora = opts.ahora || new Date();
    const estado = await estadoDeJornadaDe(req.usuario.id, ahora);
    res.json({ ok: true, data: estado });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al consultar el estado de la jornada.' });
  }
};

/**
 * Lista las asistencias del usuario autenticado, de la mas reciente a la
 * mas antigua.
 **/
const listarMisAsistencias = async (req, res) => {
  try {
    const asistencias = await Asistencia.findAll({
      where: { usuario_id: req.usuario.id },
      order: [['fecha_hora', 'DESC'], ['id', 'DESC']],
    });
    res.json({ ok: true, data: asistencias });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al listar asistencias.' });
  }
};

/**
 * Lista todas las asistencias del sistema (de todos los usuarios), incluyendo
 * los datos basicos del usuario asociado a cada marca. Requiere privilegios
 * de administrador.
 **/
const listarTodas = async (req, res) => {
  try {
    const asistencias = await Asistencia.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
      order: [['fecha_hora', 'DESC'], ['id', 'DESC']],
    });
    res.json({ ok: true, data: asistencias });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al listar asistencias.' });
  }
};

module.exports = { registrar, estadoActual, listarMisAsistencias, listarTodas };
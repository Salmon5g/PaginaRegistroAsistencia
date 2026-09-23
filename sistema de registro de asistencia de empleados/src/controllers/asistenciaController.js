/**
 * @file Controlador de registro y consulta de asistencias (marcas de
 * entrada/salida).
 * @module controllers/asistenciaController
 */

'use strict';
const { Asistencia, Usuario } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Calcula el estado de la jornada a partir de la ultima marca del dia,
 * para que el frontend sincronice sus botones con la fuente de verdad
 * (el backend) y no dependa de adivinar el orden de las marcas.
 * @param {{tipo?: string}|null} ultima - Ultima marca del dia (null si no hay).
 * @returns {{puedeEntrada: boolean, puedeSalida: boolean, ultima_tipo: string|null, texto: string}}
 */
function estadoDe(ultima) {
  if (!ultima) {
    return {
      puedeEntrada: true,
      puedeSalida: false,
      ultima_tipo: null,
      texto: 'Aun no has marcado tu entrada.',
    };
  }
  if (ultima.tipo === 'entrada') {
    return {
      puedeEntrada: false,
      puedeSalida: true,
      ultima_tipo: 'entrada',
      texto: 'Entrada registrada. Ahora marca tu salida.',
    };
  }
  return {
    puedeEntrada: true,
    puedeSalida: false,
    ultima_tipo: 'salida',
    texto: 'Jornada completada. Puedes iniciar una nueva entrada.',
  };
}

/**
 * Registra una marca de entrada o salida para el usuario autenticado.
 * Valida que la secuencia sea correcta: no se puede marcar dos entradas
 * seguidas en el mismo dia, ni una salida sin una entrada previa ese dia.
 * @name registrar
 * @function
 * @description Registra una nueva asistencia (entrada o salida).
 */
const registrar = async (req, res) => {
  try {
    const { tipo } = req.body;
    const usuario_id = req.usuario.id;

    if (!tipo || !['entrada', 'salida'].includes(tipo)) {
      return res.status(400).json({ ok: false, message: 'Tipo debe ser "entrada" o "salida".' });
    }

    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date();
    finDia.setHours(23, 59, 59, 999);

    const ultima = await Asistencia.findOne({
      where: {
        usuario_id,
        fecha_hora: { [Op.between]: [inicioDia, finDia] },
      },
      order: [['fecha_hora', 'DESC'], ['id', 'DESC']],
      // El desempate por id evita orden no determinista cuando varias
      // marcas comparten el mismo segundo (precisión de DATE/DATETIME).
    });

    if (tipo === 'entrada') {
      if (ultima && ultima.tipo === 'entrada') {
        return res.status(400).json({
          ok: false,
          message: 'Ya registraste tu entrada hoy. Debes marcar tu salida.',
          estado: estadoDe(ultima),
        });
      }
    } else {
      if (!ultima || ultima.tipo === 'salida') {
        return res.status(400).json({
          ok: false,
          message: 'Debes marcar tu entrada antes de registrar la salida.',
          estado: estadoDe(ultima),
        });
      }
    }

    const asistencia = await Asistencia.create({
      usuario_id,
      tipo,
      fecha_hora: new Date(),
    });

    res.status(201).json({
      ok: true,
      message: `${tipo} registrada.`,
      data: asistencia,
      estado: estadoDe(asistencia),
    });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al registrar asistencia.' });
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

module.exports = { registrar, listarMisAsistencias, listarTodas };

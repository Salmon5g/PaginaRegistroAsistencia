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
      order: [['fecha_hora', 'DESC']],
    });

    if (tipo === 'entrada') {
      if (ultima && ultima.tipo === 'entrada') {
        return res.status(400).json({ ok: false, message: 'Ya registraste tu entrada hoy. Debes marcar tu salida.' });
      }
      if (ultima && ultima.tipo === 'salida') {
        return res.status(400).json({ ok: false, message: 'Tu jornada de hoy ya esta completada. Vuelve manana.' });
      }
    } else {
      if (!ultima || ultima.tipo !== 'entrada') {
        return res.status(400).json({ ok: false, message: 'Debes marcar tu entrada antes de registrar la salida.' });
      }
    }

    const asistencia = await Asistencia.create({
      usuario_id,
      tipo,
      fecha_hora: new Date(),
    });

    res.status(201).json({ ok: true, message: `${tipo} registrada.`, data: asistencia });
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
      order: [['fecha_hora', 'DESC']],
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
      order: [['fecha_hora', 'DESC']],
    });
    res.json({ ok: true, data: asistencias });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al listar asistencias.' });
  }
};

module.exports = { registrar, listarMisAsistencias, listarTodas };

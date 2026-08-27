'use strict';
const { Asistencia, Usuario } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const registrar = async (req, res) => {
  try {
    const { tipo } = req.body;
    const usuario_id = req.usuario.id;

    if (!tipo || !['entrada', 'salida'].includes(tipo)) {
      return res.status(400).json({ ok: false, message: 'Tipo debe ser "entrada" o "salida".' });
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

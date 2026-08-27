'use strict';
const { Usuario } = require('../models');

const listar = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({ order: [['nombre', 'ASC']] });
    res.json({ ok: true, data: usuarios });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al listar usuarios.' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    res.json({ ok: true, data: usuario });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al obtener usuario.' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Nombre, email y password son requeridos.' });
    }

    const usuario = await Usuario.create({ nombre, email, password, rol });
    res.status(201).json({ ok: true, message: 'Usuario creado.', data: usuario });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ ok: false, message: 'El email ya esta registrado.' });
    }
    res.status(500).json({ ok: false, message: 'Error al crear usuario.' });
  }
};

const actualizar = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const { nombre, email, rol, estado, password } = req.body;
    await usuario.update({ nombre, email, rol, estado, password });

    res.json({ ok: true, message: 'Usuario actualizado.', data: usuario });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ ok: false, message: 'El email ya esta registrado.' });
    }
    res.status(500).json({ ok: false, message: 'Error al actualizar usuario.' });
  }
};

const eliminar = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    await usuario.update({ estado: 'inactivo' });
    res.json({ ok: true, message: 'Usuario desactivado.' });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al eliminar usuario.' });
  }
};

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar };

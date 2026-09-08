/**
 * @file Controlador CRUD de usuarios.
 * Todas las rutas que usan estas funciones requieren autenticacion y
 * privilegios de administrador (ver `middlewares/auth.js`).
 * @module controllers/usuarioController
 */

'use strict';
const { Usuario } = require('../models');

/**
 * Lista todos los usuarios, ordenados alfabeticamente por nombre.
 * @function listar
 * @param {import('express').Request} req - Peticion HTTP.
 * @param {import('express').Response} res - Respuesta HTTP.
 **/
const listar = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({ order: [['nombre', 'ASC']] });
    res.json({ ok: true, data: usuarios });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al listar usuarios.' });
  }
};

/**
 * @function obtenerPorId
 * @param {import('express').Request} req - Peticion HTTP. `req.params.id` es el ID del usuario.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Responde con `{ ok, data }` (200), 404 si no existe, o 500 ante error.
 */
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

/**
 * Crea un nuevo usuario. El password se hashea automaticamente mediante el
 * hook `beforeCreate` del modelo `Usuario`.
 **/
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

/**
 * Actualiza los datos de un usuario existente. Si se incluye `password` en
 * el cuerpo, se re-hashea automaticamente mediante el hook `beforeUpdate`
 * del modelo `Usuario`.
 **/
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

/**
 * Elimina un usuario (lo desactiva).
 * @async
 * @function eliminar
 * @param {import('express').Request} req - Peticion HTTP. `req.params.id` es el ID del usuario.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Responde con `{ ok, message }` (200) o 500 ante error.
 */
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

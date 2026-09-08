/**
 * @file Controlador de autenticacion.
 * Contiene la logica para el inicio de sesion de usuarios y la emision de
 * tokens JWT.
 * @module controllers/authController
 */

'use strict';
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Autentica a un usuario mediante email y password y, si son validos,
 * responde con un token JWT (valido por 8 horas) y los datos del usuario.
 * @param {import('express').Request} req - Peticion HTTP. `req.body` debe contener `{ email, password }`.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @returns {Promise<void>} Responde con:
 * 400 si falta email o password, 200 con `{ ok, message, token, usuario }` si el login es exitoso, 500 ante un error inesperado.
 **/
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email y password son requeridos.' });
    }

    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas.' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(401).json({ ok: false, message: 'Usuario desactivado.' });
    }

    const valid = await usuario.validarPassword(password);

    if (!valid) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ ok: true, message: 'Login exitoso.', token, usuario });
  } catch (err) {
    res.status(500).json({ ok: false, message: 'Error al iniciar sesion.' });
  }
};

module.exports = { login };

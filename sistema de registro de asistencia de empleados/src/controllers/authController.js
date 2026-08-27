'use strict';
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

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

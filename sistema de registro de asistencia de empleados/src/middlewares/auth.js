'use strict';
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Token no proporcionado.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario || usuario.estado !== 'activo') {
      return res.status(401).json({ ok: false, message: 'Usuario no valido.' });
    }

    req.usuario = usuario;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'Token invalido o expirado.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ ok: false, message: 'Se requieren privilegios de administrador.' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };

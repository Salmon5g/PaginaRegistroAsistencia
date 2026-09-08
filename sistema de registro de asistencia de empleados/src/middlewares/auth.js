/**
 * @file Middlewares de autenticacion y autorizacion basados en JWT.
 * @module middlewares/auth
 */

'use strict';
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

/**
 * Middleware para autenticar solicitudes usando JWT.
 * Verifica que el token proporcionado sea válido y que el usuario exista y esté activo.
 * @param {import('express').Request} req - La solicitud HTTP.
 * @param {import('express').Response} res - La respuesta HTTP.
 * @param {import('express').NextFunction} next - La función para pasar al siguiente middleware.
 */
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

/**
 * Middleware para verificar que el usuario autenticado tenga privilegios de administrador.
 * @param {import('express').Request} req - La solicitud HTTP. Requiere `req.usuario` (inyectado por `authenticate`).
 * @param {import('express').Response } res - La respuesta HTTP.
 * @param {import('express').NextFunction} next - Continua con el siguiente middleware/ruta.
 * @returns {void} Llama a `next()` si el usuario es administrador; de lo
 * contrario responde con 403. 
*/
const requireAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'administrador') {
    return res.status(403).json({ ok: false, message: 'Se requieren privilegios de administrador.' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };

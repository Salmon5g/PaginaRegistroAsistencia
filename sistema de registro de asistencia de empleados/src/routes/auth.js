/**
 * @file Rutas de autenticacion, montadas en `/api/v1/auth`. No requieren
 * token (son publicas).
 * @module routes/auth
 */

'use strict';
const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

/**
 * @name POST/api/v1/auth/login
 * @function
 * @description Inicia sesion y devuelve un token JWT. Ver {@link module:controllers/authController.login}.
 */
router.post('/login', login);

module.exports = router;

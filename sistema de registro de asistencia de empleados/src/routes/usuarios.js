/**
 * @file Rutas de gestion de usuarios, montadas en `/api/v1/usuarios`.
 * Todas las rutas requieren autenticacion (aplicada en `app.js`) y
 * privilegios de administrador (middleware `requireAdmin`).
 * @module routes/usuarios
 */

'use strict';
const express = require('express');
const router = express.Router();
const { listar, obtenerPorId, crear, actualizar, eliminar } = require('../controllers/usuarioController');
const { requireAdmin } = require('../middlewares/auth');

/**
 * @name GET/api/v1/usuarios
 * @function
 * @description Lista todos los usuarios. Ver {@link module:controllers/usuarioController.listar}.
 */
router.get('/',    requireAdmin, listar);

/**
 * @name GET/api/v1/usuarios/:id
 * @function
 * @description Obtiene un usuario por su ID. Ver {@link module:controllers/usuarioController.obtenerPorId}.
 */
router.get('/:id', requireAdmin, obtenerPorId);

/**
 * @name POST/api/v1/usuarios
 * @function
 * @description Crea un nuevo usuario. Ver {@link module:controllers/usuarioController.crear}.
 */
router.post('/',   requireAdmin, crear);

/**
 * @name PUT/api/v1/usuarios/:id
 * @function
 * @description Actualiza un usuario existente. Ver {@link module:controllers/usuarioController.actualizar}.
 */
router.put('/:id', requireAdmin, actualizar);

/**
 * @name DELETE/api/v1/usuarios/:id
 * @function
 * @description Desactiva (soft delete) un usuario. Ver {@link module:controllers/usuarioController.eliminar}.
 */
router.delete('/:id', requireAdmin, eliminar);

module.exports = router;

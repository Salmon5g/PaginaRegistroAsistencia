/**
 * @file Rutas de registro y consulta de asistencias, montadas en
 * `/api/v1/asistencias`. Todas requieren autenticacion (aplicada en
 * `app.js`); listar todas las asistencias ademas requiere privilegios de
 * administrador.
 * @module routes/asistencias
 */

'use strict';
const express = require('express');
const router = express.Router();
const { registrar, estadoActual, listarMisAsistencias, listarTodas } = require('../controllers/asistenciaController');
const { requireAdmin } = require('../middlewares/auth');

/**
 * @name POST/api/v1/asistencias
 * @function
 * @description Registra una marca de entrada o salida del usuario autenticado. Ver {@link module:controllers/asistenciaController.registrar}.
 */
router.post('/',          registrar);

/**
 * @name GET/api/v1/asistencias/estado
 * @function
 * @description Devuelve el estado de la jornada de hoy del usuario autenticado (fuente de verdad). Ver {@link module:controllers/asistenciaController.estadoActual}.
 */
router.get('/estado',     estadoActual);

/**
 * @name GET/api/v1/asistencias/mis
 * @function
 * @description Lista las asistencias del usuario autenticado. Ver {@link module:controllers/asistenciaController.listarMisAsistencias}.
 */
router.get('/mis',        listarMisAsistencias);

/**
 * @name GET/api/v1/asistencias
 * @function
 * @description Lista las asistencias de todos los usuarios (solo administradores). Ver {@link module:controllers/asistenciaController.listarTodas}.
 */
router.get('/',           requireAdmin, listarTodas);

module.exports = router;

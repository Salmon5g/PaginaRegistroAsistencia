/**
 * @file Rutas de reportes administrativos, montadas en `/api/v1/reportes`.
 * Todas requieren autenticacion (aplicada en `app.js`) y privilegios de
 * administrador.
 * @module routes/reportes
 */

'use strict';
const express = require('express');
const router = express.Router();
const { reporteAtrasos, reporteSalidasAnticipadas, reporteInasistencias } = require('../controllers/reporteController');
const { requireAdmin } = require('../middlewares/auth');

/**
 * @name GET/api/v1/reportes/atrasos
 * @function
 * @description Genera un reporte de atrasos de todos los usuarios. Ver {@link module:controllers/reporteController.reporteAtrasos}.
 */
router.get('/atrasos',            requireAdmin, reporteAtrasos);

/**
 * @name GET/api/v1/reportes/salidas-anticipadas
 * @function
 * @description Genera un reporte de salidas anticipadas de todos los usuarios. Ver {@link module:controllers/reporteController.reporteSalidasAnticipadas}.
 */
router.get('/salidas-anticipadas', requireAdmin, reporteSalidasAnticipadas);

/**
 * @name GET/api/v1/reportes/inasistencias
 * @function
 * @description Genera un reporte de inasistencias de todos los usuarios. Ver {@link module:controllers/reporteController.reporteInasistencias}.
 */
router.get('/inasistencias',       requireAdmin, reporteInasistencias);

module.exports = router;

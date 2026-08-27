'use strict';
const express = require('express');
const router = express.Router();
const { reporteAtrasos, reporteSalidasAnticipadas, reporteInasistencias } = require('../controllers/reporteController');
const { requireAdmin } = require('../middlewares/auth');

router.get('/atrasos',            requireAdmin, reporteAtrasos);
router.get('/salidas-anticipadas', requireAdmin, reporteSalidasAnticipadas);
router.get('/inasistencias',       requireAdmin, reporteInasistencias);

module.exports = router;

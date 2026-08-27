'use strict';
const express = require('express');
const router = express.Router();
const { registrar, listarMisAsistencias, listarTodas } = require('../controllers/asistenciaController');
const { requireAdmin } = require('../middlewares/auth');

router.post('/',          registrar);
router.get('/mis',        listarMisAsistencias);
router.get('/',           requireAdmin, listarTodas);

module.exports = router;

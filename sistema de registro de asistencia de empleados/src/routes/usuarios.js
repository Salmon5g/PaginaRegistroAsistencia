'use strict';
const express = require('express');
const router = express.Router();
const { listar, obtenerPorId, crear, actualizar, eliminar } = require('../controllers/usuarioController');
const { requireAdmin } = require('../middlewares/auth');

router.get('/',    requireAdmin, listar);
router.get('/:id', requireAdmin, obtenerPorId);
router.post('/',   requireAdmin, crear);
router.put('/:id', requireAdmin, actualizar);
router.delete('/:id', requireAdmin, eliminar);

module.exports = router;

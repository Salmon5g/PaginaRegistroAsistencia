'use strict';
const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();

const authRouter       = require('./routes/auth');
const usuariosRouter   = require('./routes/usuarios');
const asistenciasRouter = require('./routes/asistencias');
const reportesRouter   = require('./routes/reportes');
const { authenticate } = require('./middlewares/auth');
const errorHandler     = require('./middlewares/errorHandler');

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      process.env.CORS_ORIGIN,
    ].filter(Boolean);

    if (
      !origin ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app') ||
      allowed.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'API de asistencia funcionando' });
});

app.use('/api/v1/auth', authRouter);

app.use('/api/v1/usuarios',    authenticate, usuariosRouter);
app.use('/api/v1/asistencias', authenticate, asistenciasRouter);
app.use('/api/v1/reportes',    authenticate, reportesRouter);

app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta ${req.method} ${req.url} no encontrada.` });
});

app.use(errorHandler);

module.exports = app;

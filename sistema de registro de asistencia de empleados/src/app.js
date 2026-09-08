/**
 * @file Configuracion principal de la aplicacion Express.
 * Define middlewares globales (CORS, JSON body parser), monta los routers
 * de la API bajo el prefijo `/api/v1` y registra el manejador de rutas no
 * encontradas (404) y el manejador de errores global.
 * @module app
 */

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

/**
 * Configura CORS para permitir solicitudes desde orígenes específicos.
 * Permite solicitudes desde localhost, dominios de Vercel y Netlify, y cualquier
 * origen especificado en la variable de entorno `CORS_ORIGIN`.
 */
app.use(cors({
  /**
   * Función para determinar si un origen está permitido.
   * @param {string} origin - El origen de la solicitud.
   * @param {function} callback - Callback para indicar si el origen es permitido.
   */
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

/**
 * Ruta de prueba para verificar que la API está funcionando.
 * Responde con un objeto JSON indicando el estado de la API.
 */
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'OK', message: 'API de asistencia funcionando' });
});

app.use('/api/v1/auth', authRouter);

// Rutas protegidas por autenticación JWT
app.use('/api/v1/usuarios',    authenticate, usuariosRouter);
app.use('/api/v1/asistencias', authenticate, asistenciasRouter);
app.use('/api/v1/reportes',    authenticate, reportesRouter);

/**
 * Manejador de rutas no encontradas (404).
 * Responde con un objeto JSON indicando que la ruta solicitada no existe.
 */
app.use((req, res) => {
  res.status(404).json({ ok: false, message: `Ruta ${req.method} ${req.url} no encontrada.` });
});

app.use(errorHandler);

module.exports = app;

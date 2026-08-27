'use strict';

const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(422).json({ ok: false, message: 'Error de validacion.', errors: messages });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ ok: false, message: 'El recurso ya existe.' });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({ ok: false, message: 'Referencia invalida.' });
  }

  res.status(err.status || 500).json({
    ok: false,
    message: err.message || 'Error interno del servidor.',
  });
};

module.exports = errorHandler;

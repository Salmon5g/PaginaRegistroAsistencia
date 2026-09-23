'use strict';
const { seedAdmin } = require('../utils/admin-seeder');

module.exports = {
  up: async () => {
    await seedAdmin();
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('usuarios', { email: 'admin@asistencia.cl' }, {});
  },
};

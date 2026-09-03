<template>
  <div class="page reportes">
    <header class="reportes__header">
      <div>
        <h1 class="reportes__title">Reportes</h1>
        <p class="reportes__welcome">Genera reportes de control de asistencia para el equipo.</p>
      </div>
      <div class="reportes__header-actions">
        <NuxtLink to="/panel" class="btn btn--ghost">&larr; Panel</NuxtLink>
      </div>
    </header>

    <main class="reportes__body">
      <nav class="tabs">
        <button
          v-for="t in tabs"
          :key="t.id"
          class="tab"
          :class="{ 'tab--active': tabActiva === t.id }"
          @click="cambiarTab(t.id)"
        >
          {{ t.nombre }}
        </button>
      </nav>

      <div class="card reportes__content">
        <div class="reportes__filtros">
          <div class="form-group reportes__filtro">
            <label :for="'desde-' + tabActiva">Desde</label>
            <input :id="'desde-' + tabActiva" v-model="desde" type="date" @change="cargar" />
          </div>
          <div class="form-group reportes__filtro">
            <label :for="'hasta-' + tabActiva">Hasta</label>
            <input :id="'hasta-' + tabActiva" v-model="hasta" type="date" @change="cargar" />
          </div>
          <div class="form-group reportes__filtro" v-if="tabActiva === 'inasistencias'">
            <label for="fecha-inasistencia">Dia a evaluar</label>
            <input id="fecha-inasistencia" v-model="fechaInasistencia" type="date" @change="cargar" />
          </div>
          <button class="btn btn--primary" :disabled="cargando" @click="cargar">
            {{ cargando ? 'Generando...' : 'Generar' }}
          </button>
        </div>

        <div v-if="tabActiva === 'inasistencias'" class="reportes__resumen">
          <div class="stat">
            <span class="stat__label">Inasistentes</span>
            <span class="stat__value">{{ inasistentes.length }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">Dia</span>
            <span class="stat__value stat__value--center">{{ fechaInasistencia || 'Hoy' }}</span>
          </div>
        </div>

        <div v-else class="reportes__resumen">
          <div class="stat">
            <span class="stat__label">Empleados con registros</span>
            <span class="stat__value">{{ datos.length }}</span>
          </div>
          <div class="stat">
            <span class="stat__label">{{ tabActiva === 'atrasos' ? 'Total atrasos' : 'Total salidas anticipadas' }}</span>
            <span class="stat__value">{{ totalRegistros }}</span>
          </div>
        </div>

        <p v-if="mensaje" :class="['alert', errorGlobal ? 'alert--error' : 'alert--success']">
          {{ mensaje }}
        </p>

        <div v-if="cargando" class="empty-state">Generando reporte...</div>

        <!-- RE-01: Reporte de atrasos -->
        <template v-else-if="tabActiva === 'atrasos'">
          <div v-if="datos.length" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Email</th>
                  <th>Total atrasos</th>
                  <th>Fechas de atraso</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in datos" :key="d.usuario_id">
                  <td>{{ d.nombre }}</td>
                  <td>{{ d.email }}</td>
                  <td>
                    <div class="barra">
                      <span
                        class="barra__relleno"
                        :style="{ width: barraAncho(d.total_atrasos) }"
                      ></span>
                    </div>
                    <span class="barra__valor">{{ d.total_atrasos }}</span>
                  </td>
                  <td class="reportes__fechas">{{ d.fechas_atraso }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-state">No se encontraron atrasos en el periodo.</p>
        </template>

        <!-- RE-02: Reporte de salidas anticipadas -->
        <template v-else-if="tabActiva === 'salidas'">
          <div v-if="datos.length" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Email</th>
                  <th>Total salidas anticipadas</th>
                  <th>Fechas de salida</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in datos" :key="d.usuario_id">
                  <td>{{ d.nombre }}</td>
                  <td>{{ d.email }}</td>
                  <td>
                    <div class="barra">
                      <span
                        class="barra__relleno"
                        :style="{ width: barraAncho(d.total_salidas_anticipadas) }"
                      ></span>
                    </div>
                    <span class="barra__valor">{{ d.total_salidas_anticipadas }}</span>
                  </td>
                  <td class="reportes__fechas">{{ d.fechas_salida }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-state">No se encontraron salidas anticipadas en el periodo.</p>
        </template>

        <!-- RE-03: Reporte de inasistencias -->
        <template v-else>
          <div v-if="inasistentes.length" class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in inasistentes" :key="d.usuario_id">
                  <td>{{ d.nombre }}</td>
                  <td>{{ d.email }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="empty-state">Todos los empleados registraron asistencia ese dia.</p>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' });

const config = useRuntimeConfig();
const tabs = [
  { id: 'atrasos', nombre: 'Atrasos' },
  { id: 'salidas', nombre: 'Salidas Anticipadas' },
  { id: 'inasistencias', nombre: 'Inasistencias' },
];
const tabActiva = ref('atrasos');
const desde = ref('');
const hasta = ref('');
const fechaInasistencia = ref(new Date().toISOString().split('T')[0]);
const datos = ref([]);
const inasistentes = ref([]);
const cargando = ref(false);
const mensaje = ref('');
const errorGlobal = ref(false);

function token() {
  return localStorage.getItem('token');
}

const totalRegistros = computed(() =>
  datos.value.reduce((acc, d) => acc + Number(
    tabActiva.value === 'atrasos' ? d.total_atrasos : d.total_salidas_anticipadas
  ), 0)
);

function cambiarTab(id) {
  tabActiva.value = id;
  cargar();
}

function barraAncho(valor) {
  const max = Math.max(1, ...datos.value.map((d) => Number(
    tabActiva.value === 'atrasos' ? d.total_atrasos : d.total_salidas_anticipadas
  )));
  return `${Math.max(8, (Number(valor) / max) * 100)}%`;
}

onMounted(async () => {
  await cargar();
});

async function cargar() {
  if (!token()) return navigateTo('/login');

  cargando.value = true;
  errorGlobal.value = false;
  mensaje.value = '';
  try {
    let url = `${config.public.apiBase}/reportes/`;

    if (tabActiva.value === 'atrasos') {
      url += 'atrasos';
    } else if (tabActiva.value === 'salidas') {
      url += 'salidas-anticipadas';
    } else {
      url += 'inasistencias';
    }

    const params = new URLSearchParams();
    if (tabActiva.value !== 'inasistencias') {
      if (desde.value) params.set('desde', desde.value);
      if (hasta.value) params.set('hasta', hasta.value);
    } else if (fechaInasistencia.value) {
      params.set('fecha', fechaInasistencia.value);
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await $fetch(url, {
      headers: { Authorization: `Bearer ${token()}` },
    });

    if (tabActiva.value === 'inasistencias') {
      inasistentes.value = res.data;
      datos.value = [];
    } else {
      datos.value = res.data;
      inasistentes.value = [];
    }
  } catch (e) {
    errorGlobal.value = true;
    mensaje.value = e?.data?.message || 'Error al generar el reporte.';
    datos.value = [];
    inasistentes.value = [];
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.reportes {
  padding: 32px 24px;
}

.reportes__header {
  max-width: 960px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.reportes__title {
  font-size: 1.7rem;
}

.reportes__welcome {
  color: var(--muted);
}

.reportes__header-actions {
  display: flex;
  gap: 10px;
}

.reportes__body {
  max-width: 960px;
  margin: 0 auto;
}

.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.tab {
  font: inherit;
  font-weight: 600;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: var(--muted);
  border-radius: 10px;
  padding: 10px 18px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.tab--active {
  background: var(--primary);
  border-color: var(--primary);
  color: #ffffff;
}

.reportes__content {
  padding: 28px;
}

.reportes__filtros {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.reportes__filtro {
  margin-bottom: 0;
  min-width: 160px;
}

.reportes__filtro input {
  width: 100%;
}

.reportes__resumen {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat {
  flex: 1;
  min-width: 150px;
  background: var(--primary-light);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat__label {
  color: var(--primary-dark);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat__value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.stat__value--center {
  font-size: 1.1rem;
  display: flex;
  align-items: center;
}

.barra {
  width: 120px;
  height: 14px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
}

.barra__relleno {
  display: block;
  height: 100%;
  background: var(--primary);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.barra__valor {
  margin-left: 8px;
  font-weight: 700;
  color: var(--primary-dark);
  vertical-align: middle;
}

.reportes__fechas {
  font-size: 0.82rem;
  color: var(--muted);
  max-width: 380px;
  white-space: normal;
}

.btn--ghost {
  background: transparent;
  color: var(--primary);
  border: 1px solid #d1d5db;
}

.btn--ghost:hover {
  background: var(--primary-light);
}
</style>

<!--
  Pagina /reportes: reportes administrativos, solo para administradores
  (protegida por el middleware admin).
  Ofrece tres reportes en pestanas (atrasos, salidas anticipadas e
  inasistencias), filtrables por fecha, con salida en pantalla o descarga PDF.
-->

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="breadcrumb"><NuxtLink to="/panel">Panel</NuxtLink></p>
        <h1 class="page-header__title">Reportes</h1>
        <p class="page-header__subtitle">Genera reportes de control de asistencia para el equipo.</p>
      </div>
    </header>

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
        <div class="form-group reportes__filtro" v-if="tabActiva !== 'inasistencias'">
          <label :for="'desde-' + tabActiva">Desde</label>
          <input :id="'desde-' + tabActiva" v-model="desde" type="date" @change="cargar" />
        </div>
        <div class="form-group reportes__filtro" v-if="tabActiva !== 'inasistencias'">
          <label :for="'hasta-' + tabActiva">Hasta</label>
          <input :id="'hasta-' + tabActiva" v-model="hasta" type="date" @change="cargar" />
        </div>
        <div class="form-group reportes__filtro" v-if="tabActiva === 'inasistencias'">
          <label for="fecha-inasistencia">Dia a evaluar</label>
          <input id="fecha-inasistencia" v-model="fechaInasistencia" type="date" @change="cargar" />
        </div>
        <div class="form-group reportes__filtro reportes__filtro--formato">
          <label :for="'formato-' + tabActiva">Formato</label>
          <select :id="'formato-' + tabActiva" v-model="formato">
            <option value="web">Web (pantalla)</option>
            <option value="pdf">PDF (descargar)</option>
          </select>
        </div>
        <button class="btn btn--primary" :disabled="cargando" @click="generar">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          {{ cargando ? 'Generando...' : 'Generar reporte' }}
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
                <td class="reportes__empleado" data-label="Empleado">{{ d.nombre }}</td>
                <td data-label="Email">{{ d.email }}</td>
                <td data-label="Total">
                  <div class="barra">
                    <span
                      class="barra__relleno"
                      :style="{ width: barraAncho(d.total_atrasos) }"
                    ></span>
                  </div>
                  <span class="barra__valor">{{ d.total_atrasos }}</span>
                </td>
                <td class="reportes__fechas" data-label="Fechas">{{ d.fechas_atraso }}</td>
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
                <td class="reportes__empleado" data-label="Empleado">{{ d.nombre }}</td>
                <td data-label="Email">{{ d.email }}</td>
                <td data-label="Total">
                  <div class="barra">
                    <span
                      class="barra__relleno"
                      :style="{ width: barraAncho(d.total_salidas_anticipadas) }"
                    ></span>
                  </div>
                  <span class="barra__valor">{{ d.total_salidas_anticipadas }}</span>
                </td>
                <td class="reportes__fechas" data-label="Fechas">{{ d.fechas_salida }}</td>
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
                <td class="reportes__empleado" data-label="Empleado">{{ d.nombre }}</td>
                <td data-label="Email">{{ d.email }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="empty-state">Todos los empleados registraron asistencia ese dia.</p>
      </template>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' });


/**
 * Pestanas disponibles. El id determina el endpoint que se consulta
 * (atrasos -> /reportes/atrasos, salidas -> /reportes/salidas-anticipadas,
 * inasistencias -> /reportes/inasistencias).
 * @type {Array<{id: 'atrasos'|'salidas'|'inasistencias', nombre: string}>}
 */
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
const formato = ref('web');
const datos = ref([]);
const inasistentes = ref([]);
const cargando = ref(false);
const mensaje = ref('');
const errorGlobal = ref(false);

/**
 * Obtiene el token JWT almacenado en sessionStorage.
 * @returns {string|null} El token, o null si no hay sesion.
 */
function token() {
  return sessionStorage.getItem('token');
}

/**
 * Suma total de incidencias del reporte activo (atrasos o salidas
 * anticipadas), mostrada como indicador resumen.
 * @type {import('vue').ComputedRef<number>}
 */
const totalRegistros = computed(() =>
  datos.value.reduce((acc, d) => acc + Number(
    tabActiva.value === 'atrasos' ? d.total_atrasos : d.total_salidas_anticipadas
  ), 0)
);

/**
 * Cambia de pestana y recarga inmediatamente el reporte correspondiente.
 * @param {'atrasos'|'salidas'|'inasistencias'} id - Identificador de la pestana.
 * @returns {void}
 */
function cambiarTab(id) {
  tabActiva.value = id;
  cargar();
}

/**
 * Calcula el ancho porcentual de la barra de un usuario en el grafico,
 * relativo al valor maximo del reporte actual. Se aplica un minimo de 8%
 * para que las barras pequenas sigan siendo visibles.
 * @param {number|string} valor - Cantidad de incidencias de la fila.
 * @returns {string} Ancho en formato CSS (ej. '45%').
 */
function barraAncho(valor) {
  const max = Math.max(1, ...datos.value.map((d) => Number(
    tabActiva.value === 'atrasos' ? d.total_atrasos : d.total_salidas_anticipadas
  )));
  return `${Math.max(8, (Number(valor) / max) * 100)}%`;
}

/** Carga el reporte inicial (atrasos) al montar la pagina. */
onMounted(async () => {
  await cargar();
});

/**
 * Punto de entrada del boton "Generar": segun el formato seleccionado,
 * descarga el PDF o carga los datos para mostrarlos en pantalla.
 * @async
 * @returns {Promise<void>}
 */
async function generar() {
  if (formato.value === 'pdf') {
    await descargarPdf();
    return;
  }
  await cargar();
}

/**
 * Fuerza la descarga de un blob en el navegador creando un enlace temporal.
 * Libera la URL de objeto al terminar para no filtrar memoria.
 * @param {Blob} blob - Contenido del archivo a descargar.
 * @param {string} nombre - Nombre con el que se guardara el archivo.
 * @returns {void}
 */
function guardarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Solicita el reporte activo al backend con formato=pdf y lo descarga como
 * archivo, con nombre reporte_{tab}_{YYYY-MM-DD}.pdf.
 *
 * Los filtros enviados dependen de la pestana: desde/hasta para atrasos y
 * salidas anticipadas, fecha para inasistencias. Si no hay token, redirige
 * a /login.
 *
 * @async
 * @returns {Promise<void>}
 */
async function descargarPdf() {
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
    params.set('formato', 'pdf');
    const qs = params.toString();
    if (qs) url += `?${qs}`;

    const res = await $fetch.raw(url, {
      headers: { Authorization: `Bearer ${token()}` },
      responseType: 'blob',
    });

    const nombre = `reporte_${tabActiva.value}_${new Date().toISOString().slice(0, 10)}.pdf`;
    guardarBlob(res._data, nombre);
    mensaje.value = 'Reporte PDF descargado correctamente.';
  } catch (e) {
    errorGlobal.value = true;
    mensaje.value = e?.data?.message || 'Error al generar el PDF.';
  } finally {
    cargando.value = false;
  }
}

/**
 * Consulta el reporte activo y guarda el resultado para mostrarlo en pantalla.
 *
 * Construye la URL segun tabActiva y agrega los filtros de fecha
 * correspondientes. El resultado se guarda en inasistentes para el reporte
 * de inasistencias, o en datos para los otros dos (limpiando siempre el que
 * no corresponde). Si no hay token, redirige a /login; ante error, vacia
 * ambas listas y muestra el mensaje del backend.
 *
 * @async
 * @returns {Promise<void>}
 */
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
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.tab {
  font: inherit;
  font-weight: 600;
  font-size: 0.88rem;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--muted);
  border-radius: 999px;
  padding: 9px 18px;
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
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
}

.reportes__content {
  padding: 26px;
}

.reportes__filtros {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 22px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--border);
}

.reportes__filtro {
  margin-bottom: 0;
  min-width: 160px;
}

.reportes__filtro--formato {
  min-width: 180px;
}

.reportes__resumen {
  display: flex;
  gap: 14px;
  margin-bottom: 22px;
  flex-wrap: wrap;
}

.stat {
  flex: 1;
  min-width: 160px;
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat__label {
  color: var(--primary-dark);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  font-weight: 700;
}

.stat__value {
  font-size: 1.9rem;
  font-weight: 800;
  color: var(--primary-dark);
  letter-spacing: -0.02em;
}

.stat__value--center {
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  font-weight: 700;
}

.barra {
  width: 130px;
  height: 10px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
}

.barra__relleno {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-darker));
  border-radius: 999px;
  transition: width 0.3s ease;
}

.barra__valor {
  margin-left: 10px;
  font-weight: 800;
  color: var(--primary-dark);
  vertical-align: middle;
}

.reportes__empleado {
  font-weight: 600;
  white-space: nowrap;
}

.reportes__fechas {
  font-size: 0.8rem;
  color: var(--muted);
  max-width: 380px;
  white-space: normal;
}

/* ---------- Responsive ---------- */
@media (max-width: 640px) {
  .reportes__content {
    padding: 18px;
  }

  .reportes__filtros {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .reportes__filtro,
  .reportes__filtro--formato {
    min-width: 0;
    width: 100%;
    margin-bottom: 0;
  }

  .reportes__filtros .btn {
    width: 100%;
  }

  .reportes__resumen {
    flex-direction: column;
  }

  .stat {
    min-width: 0;
  }

  .barra {
    width: 100px;
  }
}
</style>
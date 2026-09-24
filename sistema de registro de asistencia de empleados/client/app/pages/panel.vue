<!--
  Pagina /panel: pantalla principal del usuario autenticado.
  Permite marcar entrada y salida del dia, muestra el estado actual de la
  jornada y ofrece accesos rapidos (los de administracion solo si el usuario
  es administrador).
-->

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1 class="page-header__title">Panel de Asistencia</h1>
        <p class="page-header__subtitle">
          Bienvenido, <strong>{{ usuario?.nombre }}</strong>. Registra tu jornada de hoy.
        </p>
      </div>
    </header>

    <div class="panel__grid">
      <section class="card panel__card">
        <div class="panel__heading">
          <span class="panel__heading-icon">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          </span>
          <div>
            <h2 class="panel__subtitle">Registrar asistencia</h2>
            <p class="panel__hint">Marca tu entrada y luego tu salida para registrar tu jornada de hoy.</p>
          </div>
        </div>

        <p v-if="estadoTexto" class="panel__estado">{{ estadoTexto }}</p>

        <div class="panel__actions">
          <button
            class="btn btn--success btn--big"
            :disabled="cargando || !puedeEntrada"
            @click="registrarEntrada"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="8 12 12 16 16 12" /><line x1="12" y1="8" x2="12" y2="16" /></svg>
            Marcar Entrada
          </button>
          <button
            class="btn btn--danger btn--big"
            :disabled="cargando || !puedeSalida"
            @click="preguntarSalida"
          >
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><polyline points="16 12 12 8 8 12" /><line x1="12" y1="16" x2="12" y2="8" /></svg>
            Marcar Salida
          </button>
        </div>

        <p v-if="mensaje" :class="['alert', errorRegistro ? 'alert--error' : 'alert--success']">
          {{ mensaje }}
        </p>
      </section>

      <nav class="card panel__links">
        <h2 class="panel__links-title">Accesos rapidos</h2>

        <NuxtLink to="/asistencias" class="panel__link">
          <span class="panel__link-icon">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
          </span>
          <span class="panel__link-text">
            Mis asistencias
            <small>Historial de entradas y salidas</small>
          </span>
        </NuxtLink>

        <template v-if="usuario?.rol === 'administrador'">
          <NuxtLink to="/usuarios" class="panel__link">
            <span class="panel__link-icon">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </span>
            <span class="panel__link-text">
              Gestion de Usuarios
              <small>Administra los accesos al sistema</small>
            </span>
          </NuxtLink>

          <NuxtLink to="/reportes" class="panel__link">
            <span class="panel__link-icon">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
            </span>
            <span class="panel__link-text">
              Reportes
              <small>Atrasos, salidas y inasistencias</small>
            </span>
          </NuxtLink>
        </template>
      </nav>
    </div>

    <div v-if="modalSalida" class="modal" @click.self="cancelarSalida">
      <div class="modal__card">
        <div class="modal__head">
          <h2 class="modal__title">Registrar salida</h2>
          <button class="modal__close" aria-label="Cerrar" @click="cancelarSalida">&times;</button>
        </div>

        <p class="modal__texto">¿Seguro que quieres registrar tu salida?</p>
        <p class="modal__hint">
          Al confirmar, tu jornada de hoy se completará y los botones de registro
          quedarán desactivados hasta mañana a las {{ estadoHoraInicio }}.
        </p>

        <div class="modal__actions">
          <button
            class="btn btn--ghost btn--big"
            :disabled="cargando"
            @click="cancelarSalida"
          >
            No, no estoy seguro
          </button>
          <button
            class="btn btn--danger btn--big"
            :disabled="cargando"
            @click="confirmarSalida"
          >
            {{ cargando ? 'Registrando...' : 'Sí, estoy seguro' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>

/**
 * Usuario autenticado leido desde sessionStorage.
 * @type {import('vue').Ref<{id: number, nombre: string, email: string, rol: string}|null>}
 */
const config = useRuntimeConfig();
const usuario = ref(null);
const mensaje = ref('');
const errorRegistro = ref(false);
const cargando = ref(false);
const puedeEntrada = ref(false);
const puedeSalida = ref(false);
const estadoTexto = ref('');
const estadoHoraInicio = ref('09:30');
const modalSalida = ref(false);

/**
 * Al montar la pagina, carga el usuario desde sessionStorage y consulta el
 * estado de la jornada del dia.
 */
onMounted(async () => {
  const data = sessionStorage.getItem('usuario');
  if (data) usuario.value = JSON.parse(data);
  await cargarEstado();
});

/**
 * Consulta GET {apiBase}/asistencias/estado, que es la fuente de verdad de
 * la jornada calculada en el backend (calendario de Chile): sin marcas el
 * dia habilita solo "Entrada", con entrada pendiente solo "Salida", jornada
 * completa deshabilita ambos hasta el dia siguiente y antes de la hora de
 * inicio de jornada deshabilita todo.
 *
 * Si no hay token en sessionStorage redirige a /login; ante un error de red
 * deja los botones deshabilitados sin bloquear la pagina.
 *
 * @async
 * @returns {Promise<void>}
 */
async function cargarEstado() {
  const token = sessionStorage.getItem('token');
  if (!token) return navigateTo('/login');

  try {
    const res = await $fetch(`${config.public.apiBase}/asistencias/estado`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    aplicarEstado(res.data);
  } catch (e) {
    mensaje.value = 'No se pudo consultar el estado de tu jornada. Intenta de nuevo.';
    errorRegistro.value = true;
  }
}

/**
 * Aplica el estado de jornada devuelto por el backend (fuente de verdad)
 * a los botones y al texto de estado.
 * @param {{puedeEntrada: boolean, puedeSalida: boolean, hora_inicio: string, texto: string}} estado
 */
function aplicarEstado(estado) {
  puedeEntrada.value = estado.puedeEntrada;
  puedeSalida.value = estado.puedeSalida;
  estadoTexto.value = estado.texto;
  estadoHoraInicio.value = estado.hora_inicio || '09:30';
}

/**
 * Abre el modal de confirmacion de salida (solo si el boton esta habilitado).
 */
function preguntarSalida() {
  if (!puedeSalida.value) return;
  modalSalida.value = true;
}

/**
 * "No, no estoy seguro": cierra el modal sin registrar la salida y
 * resincroniza el estado con el backend para que los botones quedan como
 * estaban (solo "Salida" habilitada).
 * @async
 */
async function cancelarSalida() {
  modalSalida.value = false;
  await cargarEstado();
}

/**
 * "Si, estoy seguro": registra la salida para completar la jornada. Al
 * terminar, el backend devuelve el estado con la jornada completada y ambos
 * botones quedan deshabilitados.
 * @async
 * @returns {Promise<void>}
 */
async function confirmarSalida() {
  if (cargando.value) return;
  modalSalida.value = false;
  await registrarAsistencia('salida');
}

/**
 * Registra la entrada del dia directamente (sin confirmacion).
 * @async
 * @returns {Promise<void>}
 */
function registrarEntrada() {
  registrarAsistencia('entrada');
}

/**
 * Registra una marca de asistencia mediante POST {apiBase}/asistencias y
 * refresca el estado de la jornada a partir de la respuesta del backend
 * (o una consulta GET en caso de error, para no quedar desincronizado).
 *
 * @async
 * @param {'entrada'|'salida'} tipo - Tipo de marca a registrar.
 * @returns {Promise<void>} Actualiza mensaje con el resultado; ante error
 * muestra el mensaje devuelto por el backend (ej. secuencia invalida de
 * entrada/salida).
 */
async function registrarAsistencia(tipo) {
  if (cargando.value) return;
  cargando.value = true;
  errorRegistro.value = false;
  try {
    const token = sessionStorage.getItem('token');
    const res = await $fetch(`${config.public.apiBase}/asistencias`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { tipo },
    });
    mensaje.value = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada correctamente`;
    aplicarEstado(res.estado);
  } catch (e) {
    errorRegistro.value = true;
    mensaje.value = e?.data?.message || 'Error al registrar';
    if (e?.data?.estado) aplicarEstado(e.data.estado);
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.panel__grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
  align-items: start;
}

.panel__heading {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}

.panel__heading-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: var(--primary-light);
  color: var(--primary-dark);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.panel__heading-icon .icon {
  width: 22px;
  height: 22px;
}

.panel__subtitle {
  font-size: 1.15rem;
  margin-bottom: 4px;
}

.panel__hint {
  color: var(--muted);
  font-size: 0.9rem;
}

.panel__estado {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-left: 4px solid var(--primary);
  color: var(--primary-dark);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.panel__estado::before {
  content: '';
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--primary);
  margin-top: 6px;
  flex: none;
}

.panel__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 8px;
}

.panel__actions .btn:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  box-shadow: none;
}

/* ---------- Accesos rapidos ---------- */
.panel__links-title {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 700;
  margin-bottom: 14px;
}

.panel__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  margin-bottom: 10px;
  transition: all 0.15s ease;
}

.panel__link:hover {
  border-color: var(--primary-border);
  background: var(--primary-light);
  text-decoration: none;
  transform: translateY(-1px);
}

.panel__link-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.panel__link:hover .panel__link-icon {
  border-color: var(--primary-border);
}

.panel__link-text {
  display: flex;
  flex-direction: column;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
  min-width: 0;
}

.panel__link-text small {
  color: var(--muted);
  font-weight: 400;
  font-size: 0.76rem;
}

/* ---------- Modal de confirmacion ---------- */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.modal__card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 28px;
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.modal__title {
  font-size: 1.35rem;
}

.modal__close {
  flex: none;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--muted);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal__close:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.modal__texto {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.modal__hint {
  color: var(--muted);
  font-size: 0.9rem;
  margin-bottom: 22px;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

/* ---------- Responsive ---------- */
@media (max-width: 640px) {
  .modal {
    padding: 12px;
    align-items: flex-end;
  }

  .modal__card {
    max-height: calc(100vh - 24px);
    padding: 20px;
    border-radius: 18px 18px 0 0;
  }

  .modal__actions {
    flex-direction: column-reverse;
  }

  .modal__actions .btn {
    width: 100%;
  }
}

@media (max-width: 900px) {
  .panel__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .panel__actions {
    grid-template-columns: 1fr;
  }
}
</style>
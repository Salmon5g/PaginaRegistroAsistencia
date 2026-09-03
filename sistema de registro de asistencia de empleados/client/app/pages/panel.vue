<template>
  <div class="page panel">
    <header class="panel__header">
      <div>
        <h1 class="panel__title">Panel de Asistencia</h1>
        <p class="panel__welcome">Bienvenido, <strong>{{ usuario?.nombre }}</strong></p>
      </div>
      <a href="#" class="btn btn--danger" @click.prevent="logout">Cerrar sesion</a>
    </header>

    <main class="panel__body">
      <div class="card">
        <h2 class="panel__subtitle">Registrar asistencia</h2>
        <p class="panel__hint">
          Marca tu entrada y luego tu salida para registrar tu jornada de hoy.
        </p>

        <p v-if="estadoTexto" class="panel__estado">{{ estadoTexto }}</p>

        <div class="panel__actions">
          <button
            class="btn btn--success btn--big"
            :disabled="cargando || !puedeEntrada"
            @click="registrarAsistencia('entrada')"
          >
            Marcar Entrada
          </button>
          <button
            class="btn btn--danger btn--big"
            :disabled="cargando || !puedeSalida"
            @click="registrarAsistencia('salida')"
          >
            Marcar Salida
          </button>
        </div>

        <p v-if="mensaje" :class="['alert', errorRegistro ? 'alert--error' : 'alert--success']">
          {{ mensaje }}
        </p>
      </div>

      <nav class="panel__links">
        <NuxtLink to="/asistencias">Ver mis asistencias &rarr;</NuxtLink>
        <template v-if="usuario?.rol === 'administrador'">
          <NuxtLink to="/usuarios">Gestion de usuarios &rarr;</NuxtLink>
        </template>
      </nav>
    </main>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const usuario = ref(null);
const mensaje = ref('');
const errorRegistro = ref(false);
const cargando = ref(false);
const puedeEntrada = ref(true);
const puedeSalida = ref(false);
const estadoTexto = ref('');
const ultimaMarca = ref(null);

onMounted(async () => {
  const data = localStorage.getItem('usuario');
  if (data) usuario.value = JSON.parse(data);
  await cargarEstado();
});

async function cargarEstado() {
  const token = localStorage.getItem('token');
  if (!token) return navigateTo('/login');

  const hoyInicio = new Date();
  hoyInicio.setHours(0, 0, 0, 0);

  try {
    const res = await $fetch(`${config.public.apiBase}/asistencias/mis`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const hoy = (res.data || []).filter((a) => new Date(a.fecha_hora) >= hoyInicio);
    ultimaMarca.value = hoy.length ? hoy[0] : null;
  } catch (e) {
    ultimaMarca.value = null;
  }

  if (!ultimaMarca.value) {
    puedeEntrada.value = true;
    puedeSalida.value = false;
    estadoTexto.value = 'Aun no has marcado tu entrada.';
  } else if (ultimaMarca.value.tipo === 'entrada') {
    puedeEntrada.value = false;
    puedeSalida.value = true;
    estadoTexto.value = 'Entrada registrada. Ahora marca tu salida.';
  } else {
    puedeEntrada.value = true;
    puedeSalida.value = false;
    estadoTexto.value = 'Jornada completada. Puedes iniciar una nueva entrada.';
  }
}

async function registrarAsistencia(tipo) {
  cargando.value = true;
  errorRegistro.value = false;
  try {
    const token = localStorage.getItem('token');
    await $fetch(`${config.public.apiBase}/asistencias`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { tipo },
    });
    mensaje.value = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada correctamente`;
    await cargarEstado();
  } catch (e) {
    errorRegistro.value = true;
    mensaje.value = e?.data?.message || 'Error al registrar';
  } finally {
    cargando.value = false;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  navigateTo('/login');
}
</script>

<style scoped>
.panel {
  padding: 32px 24px;
}

.panel__header {
  max-width: 720px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.panel__title {
  font-size: 1.7rem;
}

.panel__welcome {
  color: var(--muted);
}

.panel__body {
  max-width: 720px;
  margin: 0 auto;
}

.panel__subtitle {
  font-size: 1.2rem;
  margin-bottom: 6px;
}

.panel__hint {
  color: var(--muted);
  margin-bottom: 24px;
}

.panel__estado {
  background: var(--primary-light);
  color: var(--primary-dark);
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.panel__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 8px;
}

.btn--big {
  padding: 18px 20px;
  font-size: 1.05rem;
}

.btn--big:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.panel__links {
  margin-top: 24px;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 480px) {
  .panel__actions {
    grid-template-columns: 1fr;
  }
}
</style>
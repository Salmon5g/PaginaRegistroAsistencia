<template>
  <div class="app-shell">
    <div v-if="mobileAbierto" class="sidebar-overlay" @click="mobileAbierto = false"></div>

    <aside class="sidebar" :class="{ 'sidebar--open': mobileAbierto }">
      <div class="sidebar__brand">
        <span class="sidebar__logo">Q</span>
        <div class="sidebar__brand-text">
          <strong>Quimicos SPA</strong>
          <span>Control de asistencia</span>
        </div>
      </div>

      <nav class="sidebar__nav">
        <p class="sidebar__section">Menu</p>
        <NuxtLink to="/panel" class="sidebar__link" :class="{ 'is-active': esActivo('/panel') }" @click="mobileAbierto = false">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          Panel de Asistencia
        </NuxtLink>
        <NuxtLink to="/asistencias" class="sidebar__link" :class="{ 'is-active': esActivo('/asistencias') }" @click="mobileAbierto = false">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
          Mis Asistencias
        </NuxtLink>

        <template v-if="esAdmin">
          <p class="sidebar__section">Administracion</p>
          <NuxtLink to="/usuarios" class="sidebar__link" :class="{ 'is-active': esActivo('/usuarios') }" @click="mobileAbierto = false">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            Gestion de Usuarios
          </NuxtLink>
          <NuxtLink to="/reportes" class="sidebar__link" :class="{ 'is-active': esActivo('/reportes') }" @click="mobileAbierto = false">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>
            Reportes
          </NuxtLink>
        </template>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__usuario">
          <span class="sidebar__avatar">{{ iniciales }}</span>
          <div class="sidebar__usuario-text">
            <strong>{{ usuario?.nombre || 'Usuario' }}</strong>
            <span>{{ rolTexto }}</span>
          </div>
        </div>
        <button class="btn btn--ghost btn--small btn--block" @click="cerrarSesion">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Cerrar sesion
        </button>
      </div>
    </aside>

    <div class="app-main">
      <header class="topbar">
        <button class="topbar__hamburguesa" aria-label="Abrir menu" @click="mobileAbierto = !mobileAbierto">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <span class="topbar__marca">Quimicos SPA</span>
      </header>

      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const mobileAbierto = ref(false);
const usuario = ref(null);

onMounted(() => {
  const raw = localStorage.getItem('usuario');
  if (raw) {
    try {
      usuario.value = JSON.parse(raw);
    } catch {
      usuario.value = null;
    }
  }
});

const esAdmin = computed(() => usuario.value?.rol === 'administrador');
const rolTexto = computed(() => (esAdmin.value ? 'Administrador' : 'Empleado'));
const iniciales = computed(() =>
  (usuario.value?.nombre || 'U')
    .split(/\s+/)
    .map((p) => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
);

function esActivo(path) {
  return route.path === path;
}

function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  navigateTo('/login');
}
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* ---------- Sidebar ---------- */
.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  width: 264px;
  z-index: 40;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 22px 16px 16px;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 18px;
  border-bottom: 1px solid var(--border);
}

.sidebar__logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--primary-darker));
  color: #ffffff;
  font-weight: 800;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.35);
}

.sidebar__brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.sidebar__brand-text strong {
  font-size: 0.98rem;
  letter-spacing: -0.01em;
}

.sidebar__brand-text span {
  font-size: 0.74rem;
  color: var(--muted);
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding-top: 6px;
}

.sidebar__section {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--muted);
  margin: 18px 12px 8px;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--muted);
  font-weight: 600;
  font-size: 0.92rem;
  margin-bottom: 2px;
  transition: all 0.12s ease;
}

.sidebar__link:hover {
  background: var(--primary-light);
  color: var(--primary-dark);
  text-decoration: none;
}

.sidebar__link.is-active {
  background: var(--primary);
  color: #ffffff;
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.3);
}

.sidebar__footer {
  padding-top: 14px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar__usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 6px;
}

.sidebar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 700;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.sidebar__usuario-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  min-width: 0;
}

.sidebar__usuario-text strong {
  font-size: 0.86rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__usuario-text span {
  font-size: 0.76rem;
  color: var(--muted);
}

/* ---------- Contenido ---------- */
.app-main {
  flex: 1;
  margin-left: 264px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-content {
  flex: 1;
  padding: 36px 40px 64px;
  width: 100%;
  max-width: 1240px;
}

.topbar {
  display: none;
}

.sidebar-overlay {
  display: none;
}

/* ---------- Responsive ---------- */
@media (max-width: 960px) {
  .app-main {
    margin-left: 0;
  }

  .app-content {
    padding: 24px 20px 56px;
  }

  .topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 18px;
    position: sticky;
    top: 0;
    z-index: 35;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }

  .topbar__hamburguesa {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
  }

  .topbar__hamburguesa:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  .topbar__marca {
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: none;
  }

  .sidebar--open {
    transform: translateX(0);
    box-shadow: var(--shadow-lg);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    z-index: 30;
  }
}
</style>
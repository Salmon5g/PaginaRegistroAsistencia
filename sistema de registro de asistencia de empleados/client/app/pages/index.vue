<template>
  <div class="page page--center">
    <div class="card hero">
      <span class="hero__logo">Q</span>
      <span class="badge">Quimicos SPA</span>
      <h1 class="hero__title">Sistema de Registro de Asistencia</h1>
      <p class="hero__subtitle">
        Controla de forma simple y segura las entradas y salidas de tus empleados.
      </p>

      <ul class="hero__features">
        <li>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          Entrada y salida en un clic
        </li>
        <li>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          Historial personal de asistencia
        </li>
        <li>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          Reportes para el equipo administrativo
        </li>
      </ul>

      <div class="hero__actions">
        <NuxtLink to="/login" class="btn btn--primary">
          Iniciar sesion
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'centered' });
</script>

<style scoped>
.hero {
  max-width: 470px;
  text-align: center;
  padding: 48px 42px;
}

.hero__logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary), var(--primary-darker));
  color: #ffffff;
  font-weight: 800;
  font-size: 1.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.4);
}

.hero .badge {
  margin-bottom: 18px;
}

.hero__title {
  font-size: 1.9rem;
  line-height: 1.18;
  margin-bottom: 12px;
}

.hero__subtitle {
  color: var(--muted);
  margin-bottom: 24px;
  font-size: 0.98rem;
}

.hero__features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 28px;
  padding: 18px;
  background: var(--primary-light);
  border: 1px solid var(--primary-border);
  border-radius: 14px;
  text-align: left;
}

.hero__features li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--primary-dark);
}

.hero__features .icon {
  width: 17px;
  height: 17px;
  color: var(--success);
}

.hero__actions {
  display: flex;
  justify-content: center;
}
</style>
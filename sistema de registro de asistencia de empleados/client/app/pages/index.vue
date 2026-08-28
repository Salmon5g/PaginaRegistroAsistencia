<template>
  <div class="page page--center">
    <div class="card hero">
      <span class="badge">Quimicos SPA</span>
      <h1 class="hero__title">Sistema de Registro de Asistencia</h1>
      <p class="hero__subtitle">
        Controla de forma simple y segura las entradas y salidas de tus empleados.
      </p>
      <div class="hero__actions">
        <NuxtLink to="/login" class="btn btn--primary">Iniciar Sesion</NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero {
  max-width: 460px;
  text-align: center;
  padding: 48px 40px;
}

.hero__title {
  font-size: 1.9rem;
  line-height: 1.2;
  margin-bottom: 12px;
}

.hero__subtitle {
  color: var(--muted);
  margin-bottom: 28px;
}
</style>
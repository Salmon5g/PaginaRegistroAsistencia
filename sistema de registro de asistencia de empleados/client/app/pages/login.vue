<template>
  <div class="page page--center">
    <div class="card login-card">
      <span class="login-card__logo">Q</span>
      <span class="badge">Quimicos SPA</span>
      <h1 class="login-card__title">Iniciar sesion</h1>
      <p class="login-card__subtitle">Ingresa tus credenciales para continuar</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="tu@correo.cl" required />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="Tu clave" required />
        </div>
        <p v-if="error" class="alert alert--error">{{ error }}</p>
        <button type="submit" class="btn btn--primary btn--block" :disabled="cargando">
          {{ cargando ? 'Ingresando...' : 'Entrar' }}
        </button>
      </form>

      <p class="login-card__foot">
        <NuxtLink to="/">Volver al inicio</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'centered' });

const config = useRuntimeConfig();
const email = ref('');
const password = ref('');
const error = ref('');
const cargando = ref(false);

async function handleLogin() {
  error.value = '';
  cargando.value = true;
  try {
    const res = await $fetch(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      body: { email: email.value, password: password.value },
    });
    if (res.ok) {
      sessionStorage.setItem('token', res.token);
      sessionStorage.setItem('usuario', JSON.stringify(res.usuario));
      navigateTo('/panel');
    }
  } catch (e) {
    error.value = 'Credenciales invalidas. Verifica tu email y contrasena.';
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
}

.login-card__logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), var(--primary-darker));
  color: #ffffff;
  font-weight: 800;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.38);
  margin-bottom: 16px;
}

.login-card .badge {
  margin-bottom: 6px;
}

.login-card__title {
  font-size: 1.6rem;
  margin-bottom: 4px;
}

.login-card__subtitle {
  color: var(--muted);
  margin-bottom: 24px;
  font-size: 0.95rem;
}

.login-card__foot {
  margin-top: 20px;
  font-size: 0.9rem;
  text-align: center;
}

.login-card__foot a {
  font-weight: 600;
}
</style>
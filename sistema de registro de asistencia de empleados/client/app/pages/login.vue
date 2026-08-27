<template>
  <div class="login-container">
    <h1>Iniciar Sesion</h1>
    <form @submit.prevent="handleLogin">
      <div>
        <label>Email</label>
        <input v-model="email" type="email" required />
      </div>
      <div>
        <label>Password</label>
        <input v-model="password" type="password" required />
      </div>
      <p v-if="error" style="color:red">{{ error }}</p>
      <button type="submit">Entrar</button>
    </form>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const email = ref('');
const password = ref('');
const error = ref('');

async function handleLogin() {
  error.value = '';
  try {
    const res = await $fetch(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      body: { email: email.value, password: password.value },
    });
    if (res.ok) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
      navigateTo('/panel');
    }
  } catch (e) {
    error.value = 'Credenciales invalidas';
  }
}
</script>

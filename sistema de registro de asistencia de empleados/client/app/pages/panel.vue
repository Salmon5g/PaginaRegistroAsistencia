<template>
  <div class="panel">
    <h1>Panel de Asistencia</h1>
    <p>Bienvenido, {{ usuario?.nombre }}</p>
    <button @click="registrarAsistencia('entrada')">Marcar Entrada</button>
    <button @click="registrarAsistencia('salida')">Marcar Salida</button>
    <p v-if="mensaje">{{ mensaje }}</p>
    <br />
    <NuxtLink to="/asistencias">Ver mis asistencias</NuxtLink>
    <br />
    <a href="#" @click.prevent="logout">Cerrar sesion</a>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const usuario = ref(null);
const mensaje = ref('');

onMounted(() => {
  const data = localStorage.getItem('usuario');
  if (data) usuario.value = JSON.parse(data);
});

async function registrarAsistencia(tipo) {
  try {
    const token = localStorage.getItem('token');
    await $fetch(`${config.public.apiBase}/asistencias`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { tipo },
    });
    mensaje.value = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} registrada correctamente`;
  } catch (e) {
    mensaje.value = 'Error al registrar';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  navigateTo('/login');
}
</script>

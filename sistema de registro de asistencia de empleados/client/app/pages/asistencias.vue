<template>
  <div>
    <h1>Mis Asistencias</h1>
    <table v-if="asistencias.length">
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Fecha y Hora</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in asistencias" :key="a.id">
          <td>{{ a.tipo }}</td>
          <td>{{ new Date(a.fecha_hora).toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No hay registros.</p>
    <NuxtLink to="/panel">Volver</NuxtLink>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const asistencias = ref([]);

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) return navigateTo('/login');
  try {
    const res = await $fetch(`${config.public.apiBase}/asistencias/mis`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    asistencias.value = res.data;
  } catch (e) {
    console.error(e);
  }
});
</script>

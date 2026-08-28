<template>
  <div class="page asistencias">
    <div class="card">
      <span class="badge">Quimicos SPA</span>
      <h1 class="asistencias__title">Mis Asistencias</h1>

      <div v-if="asistencias.length" class="table-wrap">
        <table>
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
      </div>
      <p v-else class="empty-state">No hay registros por el momento.</p>

      <p class="asistencias__foot">
        <NuxtLink to="/panel">&larr; Volver al panel</NuxtLink>
      </p>
    </div>
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

<style scoped>
.asistencias {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 32px 24px;
}

.asistencias .card {
  width: 100%;
  max-width: 640px;
}

.asistencias__title {
  font-size: 1.6rem;
  margin-bottom: 20px;
}

.asistencias__foot {
  margin-top: 20px;
  font-weight: 600;
}
</style>
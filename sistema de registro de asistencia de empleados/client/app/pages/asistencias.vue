<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="breadcrumb"><NuxtLink to="/panel">Panel</NuxtLink></p>
        <h1 class="page-header__title">Mis Asistencias</h1>
        <p class="page-header__subtitle">Historial de tus entradas y salidas registradas.</p>
      </div>
    </header>

    <div class="card">
      <div v-if="asistencias.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Fecha y hora</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in asistencias" :key="a.id">
              <td data-label="Tipo">
                <span :class="['tipo-badge', a.tipo === 'entrada' ? 'tipo-badge--entrada' : 'tipo-badge--salida']">
                  {{ a.tipo }}
                </span>
              </td>
              <td data-label="Fecha y hora">{{ new Date(a.fecha_hora).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty-state">Aun no hay registros de asistencia.</p>
    </div>
  </div>
</template>

<script setup>
const config = useRuntimeConfig();
const asistencias = ref([]);

onMounted(async () => {
  const token = sessionStorage.getItem('token');
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
.tipo-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  text-transform: capitalize;
}

.tipo-badge::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.85;
}

.tipo-badge--entrada {
  background: var(--success-light);
  color: var(--success-dark);
}

.tipo-badge--salida {
  background: var(--primary-light);
  color: var(--primary-dark);
}
</style>
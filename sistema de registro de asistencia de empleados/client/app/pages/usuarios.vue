<template>
  <div class="page usuarios">
    <header class="usuarios__header">
      <div>
        <h1 class="usuarios__title">Gestion de Usuarios</h1>
        <p class="usuarios__welcome">Administra los accesos al sistema de asistencia.</p>
      </div>
      <div class="usuarios__header-actions">
        <NuxtLink to="/panel" class="btn btn--ghost">&larr; Panel</NuxtLink>
        <button class="btn btn--primary" @click="abrirNuevo">Nuevo Usuario</button>
      </div>
    </header>

    <main class="usuarios__body">
      <p v-if="mensaje" :class="['alert', errorGlobal ? 'alert--error' : 'alert--success']">
        {{ mensaje }}
      </p>

      <div v-if="cargando" class="empty-state">Cargando usuarios...</div>

      <div v-else-if="usuarios.length" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th class="usuarios__col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id">
              <td>{{ u.nombre }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span :class="['tag', u.rol === 'administrador' ? 'tag--admin' : 'tag--empleado']">
                  {{ u.rol }}
                </span>
              </td>
              <td>
                <span :class="['tag', u.estado === 'activo' ? 'tag--activo' : 'tag--inactivo']">
                  {{ u.estado }}
                </span>
              </td>
              <td class="usuarios__col-acciones">
                <button class="btn btn--small" @click="abrirEditar(u)">Editar</button>
                <button
                  class="btn btn--small btn--danger"
                  :disabled="u.id === usuarioActual?.id"
                  @click="eliminar(u)"
                >
                  {{ u.estado === 'activo' ? 'Desactivar' : 'Activar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="empty-state">No hay usuarios registrados.</p>
    </main>

    <div v-if="modalVisible" class="modal" @click.self="cerrar">
      <div class="modal__card">
        <h2 class="modal__title">{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>

        <p v-if="errorForm" class="alert alert--error">{{ errorForm }}</p>

        <form @submit.prevent="guardar">
          <div class="form-group">
            <label for="nombre">Nombre</label>
            <input id="nombre" v-model="form.nombre" type="text" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" v-model="form.email" type="email" required />
          </div>
          <div class="form-group" v-if="!editando">
            <label for="password">Password</label>
            <input id="password" v-model="form.password" type="password" required />
          </div>
          <div class="form-group" v-else>
            <label for="password">Password (dejar en blanco para no cambiar)</label>
            <input id="password" v-model="form.password" type="password" />
          </div>
          <div class="form-group">
            <label for="rol">Rol</label>
            <select id="rol" v-model="form.rol">
              <option value="empleado">Empleado</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <div class="form-group" v-if="editando">
            <label for="estado">Estado</label>
            <select id="estado" v-model="form.estado">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div class="modal__actions">
            <button type="button" class="btn btn--ghost" @click="cerrar">Cancelar</button>
            <button type="submit" class="btn btn--primary" :disabled="guardando">
              {{ guardando ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'admin' });

const config = useRuntimeConfig();
const usuarios = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const modalVisible = ref(false);
const editando = ref(false);
const mensaje = ref('');
const errorGlobal = ref(false);
const errorForm = ref('');
const usuarioActual = ref(null);

const form = reactive({
  id: null,
  nombre: '',
  email: '',
  password: '',
  rol: 'empleado',
  estado: 'activo',
});

function token() {
  return localStorage.getItem('token');
}

function usuarioDeStorage() {
  const raw = localStorage.getItem('usuario');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
}

onMounted(async () => {
  usuarioActual.value = usuarioDeStorage();
  await cargar();
});

async function cargar() {
  cargando.value = true;
  errorGlobal.value = false;
  try {
    const res = await $fetch(`${config.public.apiBase}/usuarios`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    usuarios.value = res.data;
  } catch (e) {
    errorGlobal.value = true;
    mensaje.value = e?.data?.message || 'Error al cargar usuarios.';
  } finally {
    cargando.value = false;
  }
}

function reiniciarForm() {
  form.id = null;
  form.nombre = '';
  form.email = '';
  form.password = '';
  form.rol = 'empleado';
  form.estado = 'activo';
  errorForm.value = '';
}

function abrirNuevo() {
  reiniciarForm();
  editando.value = false;
  modalVisible.value = true;
}

function abrirEditar(u) {
  reiniciarForm();
  form.id = u.id;
  form.nombre = u.nombre;
  form.email = u.email;
  form.rol = u.rol;
  form.estado = u.estado;
  editando.value = true;
  modalVisible.value = true;
}

function cerrar() {
  modalVisible.value = false;
}

async function guardar() {
  guardando.value = true;
  errorForm.value = '';
  try {
    const body = {
      nombre: form.nombre,
      email: form.email,
      rol: form.rol,
      estado: form.estado,
    };
    if (form.password) body.password = form.password;

    if (editando.value) {
      await $fetch(`${config.public.apiBase}/usuarios/${form.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}` },
        body,
      });
      mensaje.value = 'Usuario actualizado correctamente.';
    } else {
      await $fetch(`${config.public.apiBase}/usuarios`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body,
      });
      mensaje.value = 'Usuario creado correctamente.';
    }
    errorGlobal.value = false;
    modalVisible.value = false;
    await cargar();
  } catch (e) {
    errorForm.value = e?.data?.message || 'Error al guardar usuario.';
  } finally {
    guardando.value = false;
  }
}

async function eliminar(u) {
  const accion = u.estado === 'activo' ? 'desactivar' : 'activar';
  if (!confirm(`Deseas ${accion} a ${u.nombre}?`)) return;

  errorGlobal.value = false;
  try {
    await $fetch(`${config.public.apiBase}/usuarios/${u.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    mensaje.value = u.estado === 'activo'
      ? 'Usuario desactivado.'
      : 'Usuario activado.';
    await cargar();
  } catch (e) {
    errorGlobal.value = true;
    mensaje.value = e?.data?.message || 'Error al cambiar el estado del usuario.';
  }
}
</script>

<style scoped>
.usuarios {
  padding: 32px 24px;
}

.usuarios__header {
  max-width: 880px;
  margin: 0 auto 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.usuarios__title {
  font-size: 1.7rem;
}

.usuarios__welcome {
  color: var(--muted);
}

.usuarios__header-actions {
  display: flex;
  gap: 10px;
}

.usuarios__body {
  max-width: 880px;
  margin: 0 auto;
}

.usuarios__col-acciones {
  text-align: right;
  white-space: nowrap;
}

.tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: capitalize;
}

.tag--admin {
  background: var(--primary-light);
  color: var(--primary-dark);
}

.tag--empleado {
  background: #f3f4f6;
  color: var(--muted);
}

.tag--activo {
  background: var(--success-light);
  color: var(--success);
}

.tag--inactivo {
  background: var(--danger-light);
  color: var(--danger);
}

.btn--large {
  padding: 12px 22px;
}

.btn--ghost {
  background: transparent;
  color: var(--primary);
  border: 1px solid #d1d5db;
}

.btn--ghost:hover {
  background: var(--primary-light);
}

.btn--small {
  padding: 7px 12px;
  font-size: 0.82rem;
  background: var(--primary-light);
  color: var(--primary-dark);
  margin-left: 6px;
}

.btn--small:hover {
  background: var(--primary-dark);
  color: #ffffff;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(31, 41, 55, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.modal__card {
  background: #ffffff;
  border-radius: var(--radius);
  box-shadow: var(--card-shadow);
  padding: 32px;
  width: 100%;
  max-width: 460px;
}

.modal__title {
  font-size: 1.4rem;
  margin-bottom: 20px;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.form-group select {
  width: 100%;
  font: inherit;
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}
</style>

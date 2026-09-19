<!--
  Pagina /usuarios: CRUD de usuarios, solo para administradores
  (protegida por el middleware admin).
  Lista los usuarios en una tabla y permite crear y editar mediante un modal,
  ademas de desactivar/activar cuentas.
-->

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <p class="breadcrumb"><NuxtLink to="/panel">Panel</NuxtLink></p>
        <h1 class="page-header__title">Gestion de Usuarios</h1>
        <p class="page-header__subtitle">Administra los accesos al sistema de asistencia.</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--primary" @click="abrirNuevo">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo Usuario
        </button>
      </div>
    </header>

    <p v-if="mensaje" :class="['alert', errorGlobal ? 'alert--error' : 'alert--success']">
      {{ mensaje }}
    </p>

    <div class="card">
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
              <td>
                <div class="usuarios__nombre">
                  <span class="usuarios__avatar">{{ iniciales(u.nombre) }}</span>
                  <span>{{ u.nombre }}</span>
                </div>
              </td>
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
                <button class="btn btn--small btn--ghost" @click="abrirEditar(u)">Editar</button>
                <button
                  class="btn btn--small"
                  :class="u.estado === 'activo' ? 'btn--danger' : 'btn--success'"
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
    </div>

    <div v-if="modalVisible" class="modal" @click.self="cerrar">
      <div class="modal__card">
        <div class="modal__head">
          <h2 class="modal__title">{{ editando ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
          <button class="modal__close" aria-label="Cerrar" @click="cerrar">&times;</button>
        </div>

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
/**
 * Listado de usuarios obtenido del backend.
 * @type {import('vue').Ref<Array<{id: number, nombre: string, email: string, rol: string, estado: string}>>}
 */
const usuarios = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const modalVisible = ref(false);
const editando = ref(false);
const mensaje = ref('');
const errorGlobal = ref(false);
const errorForm = ref('');
const usuarioActual = ref(null);

/**
 * Estado del formulario del modal. En modo creacion id es null; en modo
 * edicion password queda vacio y solo se envia si el administrador escribe
 * una contrasena nueva.
 * @type {{id: number|null, nombre: string, email: string, password: string, rol: string, estado: string}}
 */
const form = reactive({
  id: null,
  nombre: '',
  email: '',
  password: '',
  rol: 'empleado',
  estado: 'activo',
});


/**
 * Obtiene el token JWT almacenado en localStorage.
 * @returns {string|null} El token, o null si no hay sesion.
 */
function token() {
  return localStorage.getItem('token');
}

/**
 * Lee y parsea el usuario autenticado desde localStorage.
 * @returns {object|null} El usuario, o null si no existe o el JSON es invalido.
 */
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

/**
 * Calcula las iniciales de un nombre (maximo 2 letras, en mayusculas) para
 * mostrarlas como avatar en la tabla.
 * @param {string} nombre - Nombre completo del usuario.
 * @returns {string} Iniciales; 'U' si el nombre viene vacio.
 */
function iniciales(nombre) {
  return (nombre || 'U')
    .split(/\s+/)
    .map((p) => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Al montar la pagina, carga el usuario actual y el listado de usuarios. */
onMounted(async () => {
  usuarioActual.value = usuarioDeStorage();
  await cargar();
});

/**
 * Carga el listado completo de usuarios desde GET {apiBase}/usuarios.
 * @async
 * @returns {Promise<void>} Ante error, muestra el mensaje devuelto por el backend.
 */
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

/**
 * Restablece el formulario del modal a sus valores por defecto (rol
 * empleado, estado activo) y limpia el error del formulario.
 * @returns {void}
 */
function reiniciarForm() {
  form.id = null;
  form.nombre = '';
  form.email = '';
  form.password = '';
  form.rol = 'empleado';
  form.estado = 'activo';
  errorForm.value = '';
}

/**
 * Abre el modal en modo creacion, con el formulario limpio.
 * @returns {void}
 */
function abrirNuevo() {
  reiniciarForm();
  editando.value = false;
  modalVisible.value = true;
}

/**
 * Abre el modal en modo edicion, precargando los datos del usuario
 * seleccionado. El campo password queda vacio a proposito: solo se envia
 * si el administrador escribe una contrasena nueva.
 * @param {{id: number, nombre: string, email: string, rol: string, estado: string}} u - Usuario a editar.
 * @returns {void}
 */
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

/**
 * Cierra el modal sin guardar cambios.
 * @returns {void}
 */
function cerrar() {
  modalVisible.value = false;
}

/**
 * Guarda el formulario del modal: hace PUT {apiBase}/usuarios/:id en modo
 * edicion o POST {apiBase}/usuarios en modo creacion. El campo password
 * solo se incluye en el cuerpo si tiene valor. Al terminar con exito cierra
 * el modal y recarga el listado.
 * @async
 * @returns {Promise<void>} Ante error, muestra el mensaje dentro del modal
 * (ej. email duplicado) y lo deja abierto.
 */
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


/**
 * Cambia el estado de un usuario llamando a DELETE {apiBase}/usuarios/:id,
 * previa confirmacion del administrador.
 *
 * NOTA: el endpoint del backend siempre fija el estado en 'inactivo'
 * (borrado logico), por lo que en la practica solo funciona la desactivacion.
 * Para reactivar un usuario hay que editarlo y cambiar su estado a 'activo'.
 *
 * @async
 * @param {{id: number, nombre: string, estado: string}} u - Usuario cuyo estado se quiere cambiar.
 * @returns {Promise<void>}
 */
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
.usuarios__nombre {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.usuarios__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-light);
  color: var(--primary-dark);
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.usuarios__col-acciones {
  text-align: right;
  white-space: nowrap;
}

.usuarios__col-acciones .btn + .btn {
  margin-left: 6px;
}

/* ---------- Modal ---------- */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.modal__card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  padding: 28px;
  width: 100%;
  max-width: 460px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
}

.modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.modal__title {
  font-size: 1.35rem;
}

.modal__close {
  flex: none;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--muted);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal__close:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}
</style>
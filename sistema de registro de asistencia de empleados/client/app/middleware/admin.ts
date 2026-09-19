/**
 * @file Middleware de ruta admin.
 * Protege las paginas que solo deben ser accesibles por administradores
 * (/usuarios y /reportes). Se activa declarandolo en la pagina con
 * definePageMeta({ middleware: 'admin' }).
 * @module middleware/admin
 */

/**
 * Middleware es la ruta que verifica, en el cliente y que exista un token de
 * sesión y que el usuario almacenado tenga rol administrador.
 *
 * Flujo de redirecciones:
 * - Se omite por completo durante el renderizado en servidor (import.meta.server),
 *   ya que depende de localStorage.
 * - Sin token en localStorage -> redirige a /login.
 * - Con token pero sin rol administrador (o con un usuario corrupto en
 *   localStorage) -> redirige a /panel.
 * - Administrador valido -> permite continuar a la ruta solicitada.
 *
 * @param {import('vue-router').RouteLocationNormalized} to - Ruta de destino a la que se intenta navegar.
 * @returns {ReturnType<typeof navigateTo>|void} Una redireccion (`navigateTo`) si el
 * acceso no esta permitido; `undefined` para dejar continuar la navegacion.
 */

export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return;
  const token = localStorage.getItem('token');
  if (!token) return navigateTo('/login');

  const raw = localStorage.getItem('usuario');
  let usuario = null;
  if (raw) {
    try {
      usuario = JSON.parse(raw);
    } catch {
      usuario = null;
    }
  }

  if (!usuario || usuario.rol !== 'administrador') {
    return navigateTo('/panel');
  }
});

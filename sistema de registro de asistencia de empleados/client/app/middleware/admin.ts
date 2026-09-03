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

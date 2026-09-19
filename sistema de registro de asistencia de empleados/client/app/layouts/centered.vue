<!--
  Layout centrado para la app, se utiliza para centrar el contenido de la página.
  Lo usan las paginas publicas (`/` y `/login`), donde el usuario todavia no ha iniciado sesion.
-->

<template>
  <div class="centered">
    <slot />
  </div>
</template>

<style scoped>
.centered {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
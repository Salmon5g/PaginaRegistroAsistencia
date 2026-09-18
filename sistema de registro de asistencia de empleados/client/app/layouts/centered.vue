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
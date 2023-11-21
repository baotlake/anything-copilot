<template>
  <div class="progress h-1 w-full bg-blue-500/30 overflow-hidden">
    <div class="run h-full w-1/5 bg-blue-500"></div>
  </div>
</template>

<style scoped>
.run {
  animation: run 1.5s ease-in-out infinite;
}

@keyframes run {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translate(500%);
  }
}
</style>

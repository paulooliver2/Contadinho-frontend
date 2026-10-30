<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ para: RouteLocationRaw; rotulo: string }>()
</script>

<template>
  <RouterLink :to="para" class="voltar" :aria-label="rotulo">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  </RouterLink>
</template>

<style scoped>
.voltar {
  width: var(--toque-minimo);
  height: var(--toque-minimo);
  margin-left: -12px;
  color: var(--texto);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

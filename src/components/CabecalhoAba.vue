<script setup lang="ts">
/** Título das telas de aba (Cartões, Gastos, A receber), com espaço para ações à direita. */
defineProps<{ titulo: string }>()
</script>

<template>
  <header class="cabecalho">
    <h1>{{ titulo }}</h1>
    <slot name="acoes" />
  </header>
</template>

<style scoped>
.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: var(--toque-minimo);
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>

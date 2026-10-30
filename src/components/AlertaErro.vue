<script setup lang="ts">
defineProps<{ mensagem?: string }>()
</script>

<template>
  <p v-if="mensagem" class="alerta" role="alert">{{ mensagem }}</p>
</template>

<style scoped>
.alerta {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--raio-campo);
  background: var(--alerta-claro);
  color: var(--alerta);
  font-size: 14px;
  line-height: 1.45;
}
</style>

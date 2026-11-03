<script setup lang="ts">
/** A mensagem como vai aparecer no WhatsApp: na cobrança (HU-20) e na prévia do modelo (HU-21). */
defineProps<{ texto: string; rotulo: string }>()
</script>

<template>
  <p class="balao" :aria-label="rotulo">{{ texto }}</p>
</template>

<style scoped>
.balao {
  margin: 0 0 0 32px;
  padding: 12px 14px;
  border-radius: 14px 14px 4px 14px;
  background: var(--marca-clara);
  color: var(--texto);
  font-size: 14px;
  line-height: 1.45;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>

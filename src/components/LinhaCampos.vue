<script setup lang="ts">
/** Campos lado a lado. `colunas` é o grid-template-columns, como "1.5fr 1fr". */
withDefaults(defineProps<{ colunas?: string }>(), { colunas: '1fr 1fr' })
</script>

<template>
  <div class="linha" :style="{ gridTemplateColumns: colunas }">
    <slot />
  </div>
</template>

<style scoped>
.linha {
  display: grid;
  gap: 10px;
  align-items: start;
}

/* Sem isto um campo comprido estica a coluna e empurra o vizinho para fora da tela. */
.linha > :deep(*) {
  min-width: 0;
}
</style>

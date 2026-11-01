<script setup lang="ts">
import { computed } from 'vue'

/**
 * Barra fina com a parte de cada responsável na fatura (HU-10). Estorno pode deixar uma parte negativa: ela não ocupa
 * espaço na barra.
 */
const props = defineProps<{ partes: { chave: string; cor: string; total: number }[] }>()

const segmentos = computed(() => {
  const positivas = props.partes.filter((p) => p.total > 0)
  const soma = positivas.reduce((s, p) => s + p.total, 0)
  return positivas.map((p) => ({ ...p, fracao: p.total / soma }))
})
</script>

<template>
  <div class="barra" aria-hidden="true">
    <span v-for="s in segmentos" :key="s.chave" class="segmento" :style="{ flexGrow: s.fracao, background: s.cor }" />
  </div>
</template>

<style scoped>
.barra {
  display: flex;
  gap: 2px;
  height: 8px;
}

.segmento {
  flex-basis: 0;
  min-width: 4px;
}

.segmento:first-child {
  border-radius: 4px 0 0 4px;
}

.segmento:last-child {
  border-radius: 0 4px 4px 0;
}

.segmento:only-child {
  border-radius: 4px;
}
</style>

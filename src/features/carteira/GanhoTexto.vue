<script setup lang="ts">
import { computed } from 'vue'
import { ganho } from './formatos'

/** HU-31: o ganho em reais e em %, verde no ganho e vermelho na perda; o sinal vem sempre no texto. */
const props = defineProps<{ valor: number; percentual?: number | null; escuro?: boolean }>()

const tom = computed(() => (props.valor > 0 ? 'positivo' : props.valor < 0 ? 'negativo' : 'neutro'))
</script>

<template>
  <span class="ganho" :class="[tom, { escuro }]">{{ ganho(valor, percentual) }}</span>
</template>

<style scoped>
.ganho {
  font-family: var(--fonte-numeros);
  font-size: 12px;
  white-space: nowrap;
}

.positivo {
  color: var(--marca);
}

.negativo {
  color: var(--perigo);
}

.neutro {
  color: var(--texto-suave);
}

/* No cartão escuro do topo, tons mais claros para ler bem. */
.escuro.positivo {
  color: var(--positivo);
}

.escuro.negativo {
  color: var(--alerta-claro);
}

.escuro.neutro {
  color: var(--escuro-texto-suave);
}
</style>

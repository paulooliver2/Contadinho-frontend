<script setup lang="ts">
import { computed } from 'vue'

/** Círculo com as iniciais da pessoa: a primeira letra do primeiro e do último nome, ou as duas primeiras letras. */
const props = defineProps<{ nome: string; apagada?: boolean }>()

const iniciais = computed(() => {
  const partes = props.nome.split(/\s+/).filter(Boolean)
  const letras = partes.length > 1 ? partes[0]![0]! + partes[partes.length - 1]![0]! : props.nome.slice(0, 2)
  return letras.toUpperCase()
})
</script>

<template>
  <span class="iniciais" :class="{ apagada }" aria-hidden="true">{{ iniciais }}</span>
</template>

<style scoped>
.iniciais {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--marca-clara);
  color: var(--marca-escura);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apagada {
  background: var(--divisoria);
  color: var(--texto-suave);
}
</style>

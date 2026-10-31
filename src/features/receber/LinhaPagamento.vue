<script setup lang="ts">
import { ref } from 'vue'
import { diaMes, reais } from '@/lib/formatos'
import type { Pagamento } from './receber'

/** Um pagamento recebido (HU-19). Desfazer pede um segundo toque, para não sair por engano (HU-19.3). */
const props = defineProps<{ pagamento: Pagamento; desfazendo?: boolean }>()
const emit = defineEmits<{ desfazer: [] }>()

const confirmando = ref(false)

function tocar() {
  if (props.desfazendo) return
  if (!confirmando.value) {
    confirmando.value = true
    return
  }
  confirmando.value = false
  emit('desfazer')
}
</script>

<template>
  <li class="linha">
    <span class="textos">
      <span class="descricao">Pagamento recebido</span>
      <span class="detalhes">{{ diaMes(pagamento.recebidoEm) }}</span>
    </span>
    <span class="valor">{{ reais(pagamento.valor) }}</span>
    <button
      type="button"
      class="desfazer"
      :class="{ confirmando }"
      :disabled="desfazendo"
      :aria-label="confirmando ? `Toque de novo para desfazer o pagamento de ${reais(pagamento.valor)}` : `Desfazer o pagamento de ${reais(pagamento.valor)}`"
      @click="tocar"
      @blur="confirmando = false"
    >
      {{ desfazendo ? 'Desfazendo…' : confirmando ? 'Confirmar' : 'Desfazer' }}
    </button>
  </li>
</template>

<style scoped>
.linha {
  list-style: none;
  min-height: 56px;
  padding: 6px 10px 6px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.linha + .linha {
  border-top: 1px solid var(--divisoria);
}

.textos {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.descricao {
  font-size: 14px;
  font-weight: 600;
}

.detalhes {
  font-size: 12px;
  color: var(--texto-suave);
}

.valor {
  font-family: var(--fonte-numeros);
  font-size: 14px;
  color: var(--marca);
  white-space: nowrap;
}

.desfazer {
  flex: none;
  min-height: var(--toque-minimo);
  padding: 0 10px;
  border: none;
  border-radius: 14px;
  background: var(--divisoria);
  color: var(--texto-suave);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.desfazer.confirmando {
  background: var(--alerta-claro);
  color: var(--alerta);
}
</style>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { reais } from '@/lib/formatos'
import type { Movimentacao, PosicaoResumo } from '@/stores/carteira'
import { dataCompleta, preco, quantidade } from './formatos'

/** Uma movimentação da posição. Excluir pede um segundo toque; a inicial não se exclui (HU-30). */
const props = defineProps<{ movimentacao: Movimentacao; posicao: Pick<PosicaoResumo, 'tipo' | 'simbolo'>; excluindo?: boolean }>()
const emit = defineEmits<{ excluir: [] }>()

const confirmando = ref(false)

const NOMES = { INICIAL: 'Posição inicial', APORTE: 'Aporte', RESGATE: 'Resgate' } as const

const descricao = computed(() => {
  const m = props.movimentacao
  if (m.tipo === 'RESGATE' && m.total) return 'Resgate total'
  return NOMES[m.tipo]
})

const detalhe = computed(() => {
  const m = props.movimentacao
  const partes = [dataCompleta(m.data)]
  if (m.quantidade != null) partes.push(quantidade(props.posicao, m.quantidade))
  if (m.preco != null) partes.push(`a ${preco(m.preco)}`)
  return partes.join(' · ')
})

const semValor = computed(() => props.movimentacao.tipo === 'RESGATE' && props.movimentacao.quantidade != null)

function tocar() {
  if (props.excluindo) return
  if (!confirmando.value) {
    confirmando.value = true
    return
  }
  confirmando.value = false
  emit('excluir')
}
</script>

<template>
  <li class="linha">
    <span class="textos">
      <span class="descricao">{{ descricao }}</span>
      <span class="detalhes">{{ detalhe }}</span>
    </span>
    <!-- O resgate por quantidade não tem valor em reais: o preço médio não muda (RN-48). -->
    <span v-if="movimentacao.valor != null && !semValor" class="valor" :class="{ saida: movimentacao.tipo === 'RESGATE' }">{{ reais(movimentacao.valor) }}</span>
    <button
      v-if="movimentacao.tipo !== 'INICIAL'"
      type="button"
      class="excluir"
      :class="{ confirmando }"
      :disabled="excluindo"
      :aria-label="confirmando ? `Toque de novo para excluir: ${descricao} de ${dataCompleta(movimentacao.data)}` : `Excluir: ${descricao} de ${dataCompleta(movimentacao.data)}`"
      @click="tocar"
      @blur="confirmando = false"
    >
      {{ excluindo ? 'Excluindo…' : confirmando ? 'Confirmar' : 'Excluir' }}
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

.valor.saida {
  color: var(--texto-suave);
}

.excluir {
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

.excluir.confirmando {
  background: var(--alerta-claro);
  color: var(--alerta);
}
</style>

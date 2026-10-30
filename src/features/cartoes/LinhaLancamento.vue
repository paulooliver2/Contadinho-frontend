<script setup lang="ts">
import { computed } from 'vue'
import { diaMes, reais } from '@/lib/formatos'
import type { Lancamento } from './faturas'

/** Uma compra da fatura. A digitada abre para correção (RN-60); a do arquivo, por enquanto, só aparece. */
const props = defineProps<{ lancamento: Lancamento }>()
const emit = defineEmits<{ abrir: [lancamento: Lancamento] }>()

const digitada = computed(() => props.lancamento.origem === 'MANUAL')
const detalhes = computed(() => {
  const l = props.lancamento
  const partes = [diaMes(l.data)]
  if (l.parcelaAtual && l.parcelaTotal) partes.push(`parcela ${l.parcelaAtual}/${l.parcelaTotal}`)
  if (l.valor < 0) partes.push('estorno')
  return partes.join(' · ')
})
</script>

<template>
  <li>
    <component
      :is="digitada ? 'button' : 'div'"
      :type="digitada ? 'button' : undefined"
      class="linha"
      :class="{ clicavel: digitada }"
      :aria-label="digitada ? `Corrigir ${lancamento.descricao}` : undefined"
      @click="digitada && emit('abrir', lancamento)"
    >
      <span class="textos">
        <span class="descricao">{{ lancamento.descricao }}</span>
        <span class="detalhes">
          {{ detalhes }}
          <span v-if="digitada" class="selo">digitada</span>
        </span>
      </span>
      <span class="valor" :class="{ estorno: lancamento.valor < 0 }">{{ reais(lancamento.valor) }}</span>
    </component>
  </li>
</template>

<style scoped>
li {
  list-style: none;
}

li + li {
  border-top: 1px solid var(--divisoria);
}

.linha {
  width: 100%;
  min-height: 56px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--texto);
  font: inherit;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.clicavel {
  cursor: pointer;
}

.textos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.descricao {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalhes {
  font-size: 12px;
  color: var(--texto-suave);
  display: flex;
  align-items: center;
  gap: 6px;
}

.selo {
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--info-claro);
  color: var(--info);
  font-size: 11px;
  font-weight: 600;
}

.valor {
  flex: none;
  font-family: var(--fonte-numeros);
  font-size: 14px;
}

.estorno {
  color: var(--marca);
}
</style>

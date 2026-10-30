<script setup lang="ts">
import { computed } from 'vue'
import { diaMes, reais } from '@/lib/formatos'

/** O que uma linha precisa: serve para o lançamento gravado e para o item da prévia da importação. */
export interface ItemDeFatura {
  data: string
  descricao: string
  valor: number
  parcelaAtual?: number
  parcelaTotal?: number
}

/** Uma compra da fatura. Com `clicavel`, vira botão (corrigir compra digitada, RN-60). */
const props = defineProps<{ item: ItemDeFatura; selo?: string; clicavel?: boolean }>()
const emit = defineEmits<{ abrir: [] }>()

const detalhes = computed(() => {
  const l = props.item
  const partes = [diaMes(l.data)]
  if (l.parcelaAtual && l.parcelaTotal) partes.push(`parcela ${l.parcelaAtual}/${l.parcelaTotal}`)
  if (l.valor < 0) partes.push('estorno')
  return partes.join(' · ')
})
</script>

<template>
  <li>
    <component
      :is="clicavel ? 'button' : 'div'"
      :type="clicavel ? 'button' : undefined"
      class="linha"
      :class="{ clicavel }"
      :aria-label="clicavel ? `Corrigir ${item.descricao}` : undefined"
      @click="clicavel && emit('abrir')"
    >
      <span class="textos">
        <span class="descricao">{{ item.descricao }}</span>
        <span class="detalhes">
          {{ detalhes }}
          <span v-if="selo" class="selo">{{ selo }}</span>
        </span>
      </span>
      <span class="valor" :class="{ estorno: item.valor < 0 }">{{ reais(item.valor) }}</span>
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

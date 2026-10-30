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
  /** Final do cartão que fez a compra, quando o arquivo traz (RN-19). */
  finalCartao?: string
}

/**
 * Uma compra da fatura. Com `clicavel`, vira botão (corrigir compra digitada, RN-60). Com `responsavel`, mostra de
 * quem é a compra num botão à direita (HU-08).
 */
const props = defineProps<{ item: ItemDeFatura; selo?: string; clicavel?: boolean; responsavel?: string }>()
const emit = defineEmits<{ abrir: []; responsavel: [] }>()

const detalhes = computed(() => {
  const l = props.item
  const partes = [diaMes(l.data)]
  if (l.finalCartao) partes.push(`•• ${l.finalCartao}`)
  if (l.parcelaAtual && l.parcelaTotal) partes.push(`parcela ${l.parcelaAtual}/${l.parcelaTotal}`)
  if (l.valor < 0) partes.push('estorno')
  return partes.join(' · ')
})
</script>

<template>
  <li class="fileira">
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
    <button
      v-if="responsavel"
      type="button"
      class="responsavel"
      :class="{ dono: responsavel === 'Você' }"
      :aria-label="`De quem é ${item.descricao}: ${responsavel}. Trocar`"
      @click="emit('responsavel')"
    >
      {{ responsavel }}
    </button>
  </li>
</template>

<style scoped>
li {
  list-style: none;
}

li + li {
  border-top: 1px solid var(--divisoria);
}

.fileira {
  display: flex;
  align-items: center;
}

.responsavel {
  flex: none;
  max-width: 96px;
  min-height: var(--toque-minimo);
  margin-right: 10px;
  padding: 0 10px;
  border: none;
  border-radius: 14px;
  background: var(--marca-clara);
  color: var(--marca-escura);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.responsavel.dono {
  background: var(--divisoria);
  color: var(--texto-suave);
}

.linha {
  flex: 1;
  min-width: 0;
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

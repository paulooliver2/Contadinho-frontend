<script setup lang="ts">
import { computed } from 'vue'
import { reais } from '@/lib/formatos'
import { usePessoas } from '@/stores/pessoas'
import type { Parte } from './faturas'

/**
 * HU-10: a fatura dividida por responsável, no card escuro do total. Uma barra fina com a parte de cada um e,
 * embaixo, a lista com nome, valor e quantidade de compras, que também filtra a fatura.
 * O filtro é o id da pessoa, `DONO` para as compras sem responsável, ou null para todas.
 */
const props = defineProps<{ partes: Parte[] }>()
const filtro = defineModel<string | null>('filtro', { required: true })

const pessoas = usePessoas()

const DONO = 'DONO'

const linhas = computed(() =>
  props.partes.map((p) => ({
    chave: p.pessoaId ?? DONO,
    nome: p.pessoaId ? pessoas.rotulo(p.pessoaId) : 'Você',
    cor: pessoas.cor(p.pessoaId ?? null),
    total: p.total,
    quantidade: p.quantidade,
  })),
)

/** Estorno pode deixar uma parte negativa: ela aparece na lista, mas não ocupa espaço na barra. */
const segmentos = computed(() => {
  const positivas = linhas.value.filter((l) => l.total > 0)
  const soma = positivas.reduce((s, l) => s + l.total, 0)
  return positivas.map((l) => ({ ...l, fracao: l.total / soma }))
})

function alternar(chave: string) {
  filtro.value = filtro.value === chave ? null : chave
}
</script>

<template>
  <div class="divisao">
    <div class="barra" aria-hidden="true">
      <span v-for="s in segmentos" :key="s.chave" class="segmento" :style="{ flexGrow: s.fracao, background: s.cor }" />
    </div>
    <ul class="partes" aria-label="Divisão da fatura">
      <li v-for="l in linhas" :key="l.chave">
        <button
          type="button"
          class="parte"
          :aria-pressed="filtro === l.chave"
          :aria-label="`${l.nome}: ${reais(l.total)}, ${l.quantidade} ${l.quantidade === 1 ? 'compra' : 'compras'}. Mostrar só as compras de ${l.nome}`"
          @click="alternar(l.chave)"
        >
          <span class="amostra" :style="{ background: l.cor }" />
          <span class="nome">{{ l.nome }}</span>
          <span class="quantidade">{{ l.quantidade }} {{ l.quantidade === 1 ? 'compra' : 'compras' }}</span>
          <span class="valor">{{ reais(l.total) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.divisao {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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

.partes {
  margin: 0;
  padding: 0;
  list-style: none;
}

.parte {
  width: 100%;
  min-height: var(--toque-minimo);
  padding: 0 8px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--fundo);
  font: inherit;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.parte[aria-pressed='true'] {
  background: rgb(255 255 255 / 0.12);
}

.amostra {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.nome {
  flex: 1;
  min-width: 0;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quantidade {
  font-size: 12px;
  color: var(--escuro-texto-suave);
}

.valor {
  font-family: var(--fonte-numeros);
}
</style>

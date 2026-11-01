<script setup lang="ts">
import { computed } from 'vue'
import BarraDivisao from '@/components/BarraDivisao.vue'
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

function alternar(chave: string) {
  filtro.value = filtro.value === chave ? null : chave
}
</script>

<template>
  <div class="divisao">
    <BarraDivisao :partes="linhas" />
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

<script setup lang="ts">
import { computed } from 'vue'
import BarraDivisao from '@/components/BarraDivisao.vue'
import CartaoAtalho from '@/components/CartaoAtalho.vue'
import { diaMesCurto, reais } from '@/lib/formatos'
import { usePessoas } from '@/stores/pessoas'
import type { FaturaAtual } from './resumo'

/** HU-24.3: a próxima fatura a vencer do cartão, com a divisão por pessoa. Leva à fatura em Cartões. */
const props = defineProps<{ fatura: FaturaAtual }>()

const pessoas = usePessoas()

const partes = computed(() =>
  props.fatura.partes.map((p) => ({
    chave: p.pessoaId ?? 'DONO',
    nome: p.pessoaId ? pessoas.rotulo(p.pessoaId) : 'Você',
    cor: pessoas.cor(p.pessoaId ?? null),
    total: p.total,
  })),
)

const detalhe = computed(() => `${props.fatura.fechada ? 'fechada · ' : ''}vence ${diaMesCurto(props.fatura.vencimento)}`)
</script>

<template>
  <CartaoAtalho
    :titulo="`Fatura ${fatura.cartao}`"
    :detalhe="detalhe"
    :para="{ name: 'cartoes', query: { cartao: fatura.cartaoId, fatura: fatura.mes } }"
  >
    <span class="valor">{{ reais(fatura.total) }}</span>
    <template v-if="partes.length">
      <BarraDivisao :partes="partes" />
      <span class="partes">
        <span v-for="p in partes" :key="p.chave" class="parte">{{ p.nome }} <span class="numero">{{ reais(p.total) }}</span></span>
      </span>
    </template>
    <span v-else class="vazio">Nenhuma compra nesta fatura ainda.</span>
  </CartaoAtalho>
</template>

<style scoped>
.valor {
  font-family: var(--fonte-numeros);
  font-size: 22px;
  font-weight: 600;
}

.partes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 12px;
  color: var(--texto-suave);
}

.numero {
  font-family: var(--fonte-numeros);
}

.vazio {
  font-size: 13px;
  color: var(--texto-suave);
}
</style>

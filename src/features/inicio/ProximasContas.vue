<script setup lang="ts">
import CartaoAtalho from '@/components/CartaoAtalho.vue'
import { diaMesCurto, hojeIso, reais } from '@/lib/formatos'
import type { Proximos } from './resumo'

/** HU-24.1: as 3 próximas contas fixas a pagar fora do cartão, com as já vencidas primeiro. Leva a Gastos. */
defineProps<{ contas: Proximos['contas'] }>()

const hoje = hojeIso()
</script>

<template>
  <CartaoAtalho titulo="Próximas contas" :detalhe="`fixos ${reais(contas.fixosPorMes)}/mês`" :para="{ name: 'gastos' }">
    <ul v-if="contas.proximas.length" class="linhas">
      <li v-for="c in contas.proximas" :key="c.ocorrenciaId">
        <span>
          {{ c.descricao }} ·
          <span :class="{ vencida: c.vencimento < hoje }">{{ c.vencimento < hoje ? 'venceu ' : '' }}{{ diaMesCurto(c.vencimento) }}</span>
        </span>
        <span class="valor">{{ reais(c.valor) }}</span>
      </li>
    </ul>
    <p v-else class="vazio">Nenhuma conta a pagar fora do cartão.</p>
  </CartaoAtalho>
</template>

<style scoped>
.linhas {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

.vencida {
  color: var(--alerta);
  font-weight: 600;
}

.valor {
  font-family: var(--fonte-numeros);
  white-space: nowrap;
}

.vazio {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
}
</style>

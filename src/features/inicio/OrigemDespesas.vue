<script setup lang="ts">
import { diaMesCurto, reais } from '@/lib/formatos'
import type { ResumoDoMes } from './resumo'

/**
 * De onde vêm as despesas do mês (RN-38): minha parte de cada fatura que vence no mês, contas fixas e avulsos fora do
 * cartão. O que está no cartão já vem dentro da fatura.
 */
defineProps<{ resumo: ResumoDoMes }>()
</script>

<template>
  <section class="cartao" aria-labelledby="origem-titulo">
    <h2 id="origem-titulo">De onde vêm as despesas</h2>
    <ul class="linhas">
      <li v-for="f in resumo.faturas" :key="f.cartaoId">
        <span class="nome">
          Fatura {{ f.cartao }}
          <span class="detalhe">vence {{ diaMesCurto(f.vencimento) }} · total {{ reais(f.total) }}</span>
        </span>
        <span class="valor">{{ reais(f.minhaParte) }}</span>
      </li>
      <li v-if="resumo.faturas.length === 0">
        <span class="nome">Faturas<span class="detalhe">nenhuma vence neste mês</span></span>
        <span class="valor">{{ reais(0) }}</span>
      </li>
      <li>
        <span class="nome">Contas fixas<span class="detalhe">fora do cartão</span></span>
        <span class="valor">{{ reais(resumo.despesas.contasFixas) }}</span>
      </li>
      <li>
        <span class="nome">Gastos avulsos<span class="detalhe">fora do cartão</span></span>
        <span class="valor">{{ reais(resumo.despesas.avulsos) }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.cartao {
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--superficie);
}

h2 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
}

.linhas {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 8px 0;
  font-size: 14px;
}

li + li {
  border-top: 1px solid var(--divisoria);
}

.nome {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.detalhe {
  font-size: 12px;
  color: var(--texto-suave);
}

.valor {
  font-family: var(--fonte-numeros);
  white-space: nowrap;
}
</style>

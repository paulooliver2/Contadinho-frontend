<script setup lang="ts">
import CartaoResumo from '@/components/CartaoResumo.vue'
import { reais } from '@/lib/formatos'
import type { ResumoDoMes } from './resumo'

/**
 * Card escuro do Início (HU-23): o saldo, receitas e despesas lado a lado e quanto das despesas já foi pago. Tocar
 * em Receitas abre a tela delas.
 */
defineProps<{ resumo: ResumoDoMes; ocupado?: boolean }>()
</script>

<template>
  <CartaoResumo rotulo="Saldo do mês" :valor="reais(resumo.saldo)" nome="Saldo do mês" :ocupado="ocupado">
    <div class="lados">
      <RouterLink :to="{ name: 'receitas' }" class="lado receitas">
        <span class="rotulo">Receitas</span>
        <span class="numero positivo">+ {{ reais(resumo.receitas.total) }}</span>
      </RouterLink>
      <p class="lado">
        <span class="rotulo">Despesas</span>
        <span class="numero negativo">− {{ reais(resumo.despesas.total) }}</span>
      </p>
    </div>
    <p v-if="resumo.despesas.total > 0" class="pago">
      Das despesas, {{ reais(resumo.despesas.pago) }} já foram pagas e {{ reais(resumo.despesas.aPagar) }} ainda vencem.
    </p>
  </CartaoResumo>
</template>

<style scoped>
.lados {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.lado {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.receitas {
  color: inherit;
  text-decoration: none;
  min-height: var(--toque-minimo);
}

.rotulo {
  font-size: 12px;
  color: var(--escuro-texto-suave);
}

.numero {
  font-family: var(--fonte-numeros);
  font-size: 15px;
}

.positivo {
  color: var(--positivo);
}

.negativo {
  color: var(--alerta-forte);
}

.pago {
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--escuro-texto-suave);
}
</style>

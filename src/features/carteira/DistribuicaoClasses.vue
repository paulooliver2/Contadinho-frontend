<script setup lang="ts">
import { computed } from 'vue'
import BarraDivisao from '@/components/BarraDivisao.vue'
import { reais } from '@/lib/formatos'
import type { Fatia } from '@/stores/carteira'
import { CORES_CLASSE, ROTULOS_CLASSE } from './formatos'

/** HU-32: quanto da carteira está em renda fixa, ações (com ETFs), FIIs e cripto, pelo valor de hoje. */
const props = defineProps<{ fatias: Fatia[] }>()

const partes = computed(() => props.fatias.map((f) => ({ chave: f.classe, cor: CORES_CLASSE[f.classe], total: f.valor })))
const porcento = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
</script>

<template>
  <div class="distribuicao">
    <BarraDivisao :partes="partes" />
    <ul class="classes">
      <li v-for="f in fatias" :key="f.classe" class="classe">
        <span class="ponto" :style="{ background: CORES_CLASSE[f.classe] }" aria-hidden="true" />
        <span class="nome">{{ ROTULOS_CLASSE[f.classe] }}</span>
        <span class="valor">{{ reais(f.valor) }}</span>
        <span class="pct">{{ porcento.format(f.percentual) }}%</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.distribuicao {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.classes {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.classe {
  display: grid;
  grid-template-columns: 10px 1fr auto 64px;
  gap: 8px;
  align-items: center;
  font-size: 14px;
}

.ponto {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.valor,
.pct {
  font-family: var(--fonte-numeros);
  font-size: 13px;
  text-align: right;
}

.pct {
  color: var(--texto-suave);
}
</style>

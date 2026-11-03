<script setup lang="ts">
import { computed } from 'vue'
import { reais } from '@/lib/formatos'
import type { Evolucao, Periodo } from '@/stores/carteira'
import { diaMes, percentual } from './formatos'
import GanhoTexto from './GanhoTexto.vue'

/**
 * HU-32: quanto a carteira rendeu no período, sem contar o dinheiro que entrou ou saiu (RN-49), ao lado do CDI dos
 * mesmos dias. No Dia, o CDI é o do último dia útil, porque o de hoje só sai amanhã.
 */
const props = defineProps<{ evolucao: Evolucao; periodo: Periodo }>()

const cdi = computed(() => {
  const e = props.evolucao
  if (e.cdiPercentual == null || e.cdiAte == null) return ''
  const texto = percentual(e.cdiPercentual)
  return props.periodo === 'DIA' ? `CDI de ${diaMes(e.cdiAte)} ${texto}` : `CDI ${texto}`
})

const fluxos = computed(() => {
  const partes: string[] = []
  if (props.evolucao.aportes > 0) partes.push(`Aportes: ${reais(props.evolucao.aportes)}`)
  if (props.evolucao.resgates > 0) partes.push(`Resgates: ${reais(props.evolucao.resgates)}`)
  return partes.join(' · ')
})
</script>

<template>
  <div class="rendimento">
    <p class="linha">
      <GanhoTexto class="ganho" :valor="evolucao.ganho" :percentual="evolucao.ganhoPercentual" />
      <span v-if="cdi" class="cdi">{{ cdi }}</span>
    </p>
    <p v-if="evolucao.desdeCadastro" class="nota">desde {{ diaMes(evolucao.de) }}</p>
    <p v-if="fluxos" class="nota">{{ fluxos }}</p>
  </div>
</template>

<style scoped>
.rendimento {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.linha {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: baseline;
}

.ganho {
  font-size: 15px;
  font-weight: 600;
}

.cdi,
.nota {
  font-size: 12px;
  color: var(--texto-suave);
}

.nota {
  margin: 0;
}
</style>

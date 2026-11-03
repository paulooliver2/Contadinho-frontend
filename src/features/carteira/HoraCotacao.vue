<script setup lang="ts">
import { computed } from 'vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import type { PosicaoResumo } from '@/stores/carteira'
import { quando } from './formatos'

/** HU-31: de quando é o valor mostrado (RN-47): "atualizado às 14:32", "CDI até 31/10" ou "desatualizado desde …". */
const props = defineProps<{ posicao: PosicaoResumo }>()

const texto = computed(() => {
  const p = props.posicao
  if (p.encerrada) return ''
  if (p.tipo === 'RENDA_FIXA') {
    if (!p.cdiAte) return 'sem cotação ainda'
    const [, mes, dia] = p.cdiAte.split('-')
    return p.desatualizado ? `desatualizado: CDI até ${dia}/${mes}` : `CDI até ${dia}/${mes}`
  }
  if (!p.atualizadoEm) return 'sem cotação ainda'
  const q = quando(p.atualizadoEm)
  if (p.desatualizado) return `desatualizado desde ${q.texto}`
  return q.hoje ? `atualizado às ${q.texto}` : `atualizado em ${q.texto}`
})
</script>

<template>
  <TextoAjuda v-if="texto" :tom="posicao.desatualizado ? 'aviso' : 'neutro'">{{ texto }}</TextoAjuda>
</template>

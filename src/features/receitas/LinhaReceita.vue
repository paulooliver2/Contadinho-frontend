<script setup lang="ts">
import { computed } from 'vue'
import LinhaItem from '@/components/LinhaItem.vue'
import { diaMes, diasEntre, hojeIso, reais } from '@/lib/formatos'
import type { ReceitaDoMes } from './receitas'

/** Uma receita no mês (HU-22): quando cai, o valor e o status. A prevista diz em quantos dias cai. */
const props = defineProps<{ item: ReceitaDoMes }>()
const emit = defineEmits<{ abrir: [] }>()

const detalhe = computed(() => {
  const i = props.item
  const partes = [i.receita.recorrente ? `Todo dia ${i.receita.dia}` : `Uma vez · ${diaMes(i.data)}`]
  if (i.status === 'PREVISTA') {
    const dias = diasEntre(hojeIso(), i.data)
    partes.push(dias === 1 ? 'cai amanhã' : `cai em ${dias} dias`)
  }
  if (i.status === 'RECEBIDA' && i.valorRecebido !== i.valorPrevisto) partes.push('caiu outro valor')
  return partes.join(' · ')
})

const selo = computed(() => {
  if (props.item.status === 'RECEBIDA') return { texto: 'Recebido', tom: 'paga' } as const
  if (props.item.status === 'A_CONFIRMAR') return { texto: 'Caiu, confirmar', tom: 'atrasada' } as const
  return { texto: 'Previsto', tom: 'aberta' } as const
})
</script>

<template>
  <LinhaItem
    :iniciais="item.receita.descricao.slice(0, 2).toUpperCase()"
    :titulo="item.receita.descricao"
    :detalhe="detalhe"
    :valor="reais(item.valor)"
    :selo="selo"
    :acao="`Abrir ${item.receita.descricao}`"
    @abrir="emit('abrir')"
  />
</template>

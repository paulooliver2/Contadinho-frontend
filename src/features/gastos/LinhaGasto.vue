<script setup lang="ts">
import { computed } from 'vue'
import LinhaItem from '@/components/LinhaItem.vue'
import { diaMes, reais } from '@/lib/formatos'
import type { Gasto } from './gastos'

/** Um gasto avulso (HU-12): iniciais da categoria, data e como pagou, o valor e, no cartão, o status (RN-26). */
const props = defineProps<{ item: Gasto; categoria: string; cartao?: string }>()
const emit = defineEmits<{ abrir: [] }>()

const detalhe = computed(() => {
  const forma = {
    PIX_BOLETO: 'Pix ou boleto',
    DEBITO: 'Débito',
    CARTAO: `Cartão ${props.cartao ?? ''}`.trim(),
  }[props.item.formaPagamento]
  return `${diaMes(props.item.data)} · ${forma}`
})

const selo = computed(() => {
  if (props.item.status === 'NA_FATURA') return { texto: 'Na fatura', tom: 'fatura' } as const
  if (props.item.status === 'AGUARDANDO_FATURA') return { texto: 'Aguardando fatura', tom: 'fatura' } as const
  return undefined
})
</script>

<template>
  <LinhaItem
    :iniciais="categoria.slice(0, 2).toUpperCase()"
    :titulo="item.descricao"
    :detalhe="detalhe"
    :valor="reais(item.valor)"
    :selo="selo"
    :acao="`Editar ${item.descricao}`"
    @abrir="emit('abrir')"
  />
</template>

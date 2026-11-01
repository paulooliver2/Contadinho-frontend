<script setup lang="ts">
import { computed } from 'vue'
import LinhaItem from '@/components/LinhaItem.vue'
import { diasEntre, hojeIso, reais } from '@/lib/formatos'
import type { ContaDoMes } from './gastos'

/**
 * Uma conta fixa no mês (HU-11): iniciais da categoria, como se paga, o valor e o status (RN-57). A pagar mostra
 * quanto falta para vencer. Tocar abre a conta do mês (HU-13).
 */
const props = defineProps<{ item: ContaDoMes; categoria: string; cartao?: string }>()
const emit = defineEmits<{ abrir: [] }>()

const detalhes = computed(() => {
  const c = props.item.conta
  const forma = {
    PIX_BOLETO: 'Pix ou boleto',
    DEBITO_AUTOMATICO: 'Débito automático',
    CARTAO: `Cartão ${props.cartao ?? ''}`.trim(),
  }[c.formaPagamento]
  const partes = [`Todo dia ${c.diaVencimento}`, forma]
  if (c.encerradaEm) partes.push('encerrada')
  return partes.join(' · ')
})

const selo = computed(() => {
  const i = props.item
  if (i.status === 'PAGA') return { texto: 'Paga', tom: 'paga' } as const
  if (i.status === 'NA_FATURA') return { texto: 'Na fatura', tom: 'fatura' } as const
  if (i.status === 'AGUARDANDO_FATURA') return { texto: 'Aguardando fatura', tom: 'fatura' } as const
  const dias = diasEntre(hojeIso(), i.vencimento)
  if (dias > 1) return { texto: `Vence em ${dias} dias`, tom: 'aberta' } as const
  if (dias === 1) return { texto: 'Vence amanhã', tom: 'aberta' } as const
  if (dias === 0) return { texto: 'Vence hoje', tom: 'atrasada' } as const
  return { texto: dias === -1 ? 'Venceu ontem' : `Venceu há ${-dias} dias`, tom: 'atrasada' } as const
})
</script>

<template>
  <LinhaItem
    :iniciais="categoria.slice(0, 2).toUpperCase()"
    :titulo="item.conta.descricao"
    :detalhe="detalhes"
    :valor="reais(item.valor)"
    :selo="selo"
    :acao="`Abrir ${item.conta.descricao}`"
    @abrir="emit('abrir')"
  />
</template>

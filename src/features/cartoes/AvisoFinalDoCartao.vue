<script setup lang="ts">
import { computed } from 'vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import type { Adicionais } from './adicionais'

/**
 * HU-38.3: a regra do adicional só vale quando o arquivo traz o final do cartão em cada compra. Hoje só o PDF do
 * Inter traz; o OFX não traz em nenhum banco.
 */
const props = defineProps<{ trazFinal: Adicionais['trazFinal']; banco: string }>()

const onde = computed(() =>
  props.banco === 'INTER'
    ? 'O PDF da fatura do Inter traz; o OFX não traz.'
    : 'Por enquanto, só o PDF da fatura do Inter traz; o OFX não traz em nenhum banco.',
)
</script>

<template>
  <TextoAjuda v-if="trazFinal === 'SIM'" tom="sucesso">
    Os arquivos importados neste cartão trazem o final de cada compra: as compras dos adicionais chegam com a pessoa.
  </TextoAjuda>
  <TextoAjuda v-else-if="trazFinal === 'NAO'" tom="aviso">
    Os arquivos importados neste cartão não trazem o final de cada compra, então as compras dos adicionais chegam
    com você e é preciso atribuir na fatura. {{ onde }}
  </TextoAjuda>
  <TextoAjuda v-else>
    As compras do adicional chegam com a pessoa quando o arquivo do banco traz o final do cartão em cada compra.
    {{ onde }}
  </TextoAjuda>
</template>

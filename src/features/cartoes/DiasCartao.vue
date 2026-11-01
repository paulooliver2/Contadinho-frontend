<script setup lang="ts">
import CampoTexto from '@/components/CampoTexto.vue'
import LinhaCampos from '@/components/LinhaCampos.vue'

/** Os dias de fechamento e de vencimento, no cadastro (HU-05) e na edição (HU-45) do cartão. */
defineProps<{ erroFechamento?: string; erroVencimento?: string }>()
const fechamento = defineModel<string>('fechamento', { required: true })
const vencimento = defineModel<string>('vencimento', { required: true })
</script>

<template>
  <LinhaCampos>
    <CampoTexto v-model="fechamento" rotulo="Dia do fechamento" placeholder="Ex.: 5" numerico :maxlength="2" autocomplete="off" :erro="erroFechamento" />
    <CampoTexto v-model="vencimento" rotulo="Dia do vencimento" placeholder="Ex.: 15" numerico :maxlength="2" autocomplete="off" :erro="erroVencimento" />
  </LinhaCampos>
</template>

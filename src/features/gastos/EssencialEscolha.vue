<script setup lang="ts">
import { computed } from 'vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useCategorias } from '@/stores/categorias'

/**
 * "É essencial?" de uma conta fixa ou gasto. Null segue a categoria (RN-28): o chip marcado mostra o padrão dela até
 * o dono escolher.
 */
const props = defineProps<{ categoriaId: string | null }>()
const essencial = defineModel<boolean | null>({ required: true })

const categorias = useCategorias()

const OPCOES = [
  { valor: 'SIM', rotulo: 'Sim' },
  { valor: 'NAO', rotulo: 'Não' },
] as const

const categoria = computed(() => (props.categoriaId ? categorias.porId(props.categoriaId) : undefined))
const efetivo = computed(() => essencial.value ?? categoria.value?.essencial ?? null)
const marcado = computed(() => (efetivo.value === null ? null : efetivo.value ? 'SIM' : 'NAO'))

function escolher(v: 'SIM' | 'NAO' | null) {
  essencial.value = v === null ? null : v === 'SIM'
}
</script>

<template>
  <ChipsEscolha :model-value="marcado" rotulo="É essencial?" :opcoes="OPCOES" @update:model-value="escolher">
    <TextoAjuda v-if="categoria && essencial === null">
      Padrão da categoria {{ categoria.nome }}: {{ categoria.essencial ? 'essencial' : 'não essencial' }}.
    </TextoAjuda>
  </ChipsEscolha>
</template>

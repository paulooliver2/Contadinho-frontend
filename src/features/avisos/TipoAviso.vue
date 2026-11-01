<script setup lang="ts">
import Interruptor from '@/components/Interruptor.vue'
import QuadroResumo from '@/components/QuadroResumo.vue'

/** Um tipo de aviso (HU-28.1): o interruptor, a antecedência no slot quando ligado e a prévia do aviso (HU-28.3). */
defineProps<{ rotulo: string; descricao: string; previa: string }>()
const ligado = defineModel<boolean>({ required: true })
</script>

<template>
  <div class="tipo">
    <Interruptor v-model="ligado" :rotulo="rotulo" :descricao="descricao" />
    <template v-if="ligado">
      <slot />
      <QuadroResumo :rotulo="`Prévia: ${rotulo.toLowerCase()}`" :texto="previa" />
    </template>
  </div>
</template>

<style scoped>
.tipo {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 0;
}

.tipo + .tipo {
  border-top: 1px solid var(--divisoria);
}
</style>

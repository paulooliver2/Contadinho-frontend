<script setup lang="ts">
/** Uma linha em destaque numa folha: o que é, à esquerda, e o valor, à direita ("Paga em 30/10 · R$ 142,37"). */
defineProps<{ rotulo: string; valor: string }>()
</script>

<template>
  <p class="linha">
    <span>{{ rotulo }}</span><span class="valor">{{ valor }}</span>
  </p>
</template>

<style scoped>
.linha {
  margin: 0;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 15px;
  font-weight: 600;
}

.valor {
  font-family: var(--fonte-numeros);
  white-space: nowrap;
}
</style>

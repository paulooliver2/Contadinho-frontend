<script setup lang="ts">
const emit = defineEmits<{ enviar: [] }>()
</script>

<template>
  <!-- novalidate: as mensagens são as nossas, em português, e não as do navegador. -->
  <form class="formulario" novalidate @submit.prevent="emit('enviar')">
    <slot />
  </form>
</template>

<style scoped>
.formulario {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>

<script setup lang="ts">
withDefaults(defineProps<{ tamanho?: number }>(), { tamanho: 22 })
</script>

<template>
  <svg :width="tamanho" :height="tamanho" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4.5 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM2.5 10h19" />
  </svg>
</template>

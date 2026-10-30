<script setup lang="ts">
withDefaults(defineProps<{ tamanho?: number }>(), { tamanho: 22 })
</script>

<template>
  <svg :width="tamanho" :height="tamanho" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 19.5c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5M16 4.8a3.5 3.5 0 0 1 0 6.4M18.5 14.8c1.5.7 2.6 2.4 3 4.7" />
  </svg>
</template>

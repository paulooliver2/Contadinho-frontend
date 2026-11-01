<script setup lang="ts">
/** Botão "+ Novo …" do cabeçalho das telas (Novo gasto, Nova receita). */
defineProps<{ texto: string }>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button type="button" class="novo" @click="emit('click')">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
    {{ texto }}
  </button>
</template>

<style scoped>
.novo {
  min-height: var(--toque-minimo);
  padding: 0 18px;
  border: none;
  border-radius: 24px;
  background: var(--marca);
  color: #FFFFFF;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
</style>

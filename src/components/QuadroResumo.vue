<script setup lang="ts">
/**
 * Quadro cinza com um rótulo e uma linha de texto: o cadastro de uma conta, o resumo do que vai ser salvo (com
 * `destaque`, em negrito).
 */
defineProps<{ rotulo: string; texto: string; destaque?: boolean }>()
</script>

<template>
  <section class="quadro" :aria-label="rotulo">
    <span class="rotulo">{{ rotulo }}</span>
    <span class="texto" :class="{ destaque }">{{ texto }}</span>
  </section>
</template>

<style scoped>
.quadro {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--fundo);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rotulo {
  font-size: 12px;
  color: var(--rotulo);
}

.texto {
  font-size: 14px;
}

.destaque {
  font-weight: 600;
}
</style>

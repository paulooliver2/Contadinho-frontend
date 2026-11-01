<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/** Card branco que leva a outra tela, com título, um detalhe à direita e o conteúdo embaixo (Início, HU-24). */
defineProps<{ titulo: string; detalhe?: string; para: RouteLocationRaw }>()
</script>

<template>
  <RouterLink :to="para" class="cartao">
    <span class="topo">
      <span class="titulo">{{ titulo }}</span>
      <span v-if="detalhe" class="detalhe">{{ detalhe }}</span>
    </span>
    <slot />
  </RouterLink>
</template>

<style scoped>
.cartao {
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--superficie);
  color: var(--texto);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.topo {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.titulo {
  font-size: 16px;
  font-weight: 600;
}

.detalhe {
  font-size: 12px;
  color: var(--texto-suave);
  white-space: nowrap;
}
</style>

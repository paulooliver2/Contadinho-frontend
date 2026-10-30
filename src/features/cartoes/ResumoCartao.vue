<script setup lang="ts">
import type { Cartao } from '@/stores/cartoes'

/** Cabeçalho do cartão escolhido; a fatura vem logo abaixo, no FaturaCartao. */
defineProps<{ cartao: Cartao }>()
</script>

<template>
  <section class="resumo" :aria-label="`Cartão ${cartao.apelido}`">
    <p class="titulo">{{ cartao.apelido }} <span class="final">•• {{ cartao.ultimos4 }}</span></p>
    <p class="dias">Fecha dia {{ cartao.diaFechamento }} · vence dia {{ cartao.diaVencimento }}</p>
  </section>
</template>

<style scoped>
.resumo {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--superficie);
}

.titulo {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.final {
  font-family: var(--fonte-numeros);
  font-weight: 400;
}

.dias {
  margin: 0;
  font-size: 12px;
  color: var(--texto-suave);
}
</style>

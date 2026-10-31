<script setup lang="ts">
/**
 * Card escuro com o número principal da tela (total da fatura, total a receber). O que vier no slot aparece
 * embaixo: datas, divisão, totais secundários.
 */
defineProps<{ rotulo: string; valor: string; /** Nome do card para leitores de tela. */ nome: string; ocupado?: boolean }>()
</script>

<template>
  <section class="resumo" :aria-label="nome" :aria-busy="ocupado || undefined">
    <p class="rotulo">{{ rotulo }}</p>
    <p class="valor">{{ valor }}</p>
    <slot />
  </section>
</template>

<style scoped>
.resumo {
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--escuro);
  color: var(--fundo);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.resumo :slotted(p),
.resumo p {
  margin: 0;
}

.rotulo {
  font-size: 12px;
  color: var(--escuro-texto-suave);
}

.valor {
  font-family: var(--fonte-numeros);
  font-size: 28px;
  font-weight: 600;
}
</style>

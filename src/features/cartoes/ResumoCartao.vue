<script setup lang="ts">
import type { Cartao } from '@/stores/cartoes'

/** Cabeçalho do cartão escolhido, com "Editar" (HU-45); a fatura vem logo abaixo, no FaturaCartao. */
defineProps<{ cartao: Cartao }>()
defineEmits<{ editar: [] }>()
</script>

<template>
  <section class="resumo" :aria-label="`Cartão ${cartao.apelido}`">
    <div>
      <p class="titulo">{{ cartao.apelido }} <span class="final">•• {{ cartao.ultimos4 }}</span></p>
      <p class="dias">Fecha dia {{ cartao.diaFechamento }} · vence dia {{ cartao.diaVencimento }}</p>
    </div>
    <button type="button" class="editar" :aria-label="`Editar ${cartao.apelido}`" @click="$emit('editar')">Editar</button>
  </section>
</template>

<style scoped>
.resumo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px 8px 16px;
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
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--texto-suave);
}

.editar {
  flex: none;
  min-height: var(--toque-minimo);
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--marca);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>

<script setup lang="ts">
import type { Cartao } from '@/stores/cartoes'

/** Fileira de cartões no topo da aba, com o botão de adicionar no fim. */
defineProps<{ cartoes: Cartao[] }>()
const selecionado = defineModel<string | null>({ required: true })
const emit = defineEmits<{ adicionar: [] }>()
</script>

<template>
  <div class="fileira" role="group" aria-label="Escolher cartão">
    <button
      v-for="cartao in cartoes"
      :key="cartao.id"
      type="button"
      class="cartao"
      :aria-pressed="selecionado === cartao.id"
      @click="selecionado = cartao.id"
    >
      <span class="apelido">{{ cartao.apelido }}</span>
      <span class="final">•• {{ cartao.ultimos4 }}</span>
    </button>
    <button type="button" class="adicionar" aria-label="Adicionar cartão" @click="emit('adicionar')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Cartão
    </button>
  </div>
</template>

<style scoped>
.fileira {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.cartao,
.adicionar {
  flex: none;
  min-height: 52px;
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.cartao {
  border: 1px solid var(--borda);
  background: var(--superficie);
  color: var(--texto);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.cartao[aria-pressed='true'] {
  border-color: var(--escuro);
  background: var(--escuro);
  color: var(--fundo);
}

.apelido {
  white-space: nowrap;
}

.final {
  font-family: var(--fonte-numeros);
  font-size: 11px;
  font-weight: 400;
  color: var(--texto-suave);
}

.cartao[aria-pressed='true'] .final {
  color: var(--escuro-texto-suave);
}

.adicionar {
  border: 1px dashed #9AA8A1;
  background: transparent;
  color: var(--texto);
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>

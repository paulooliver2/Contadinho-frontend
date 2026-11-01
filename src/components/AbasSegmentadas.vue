<script setup lang="ts" generic="T extends string">
/** Duas ou três abas lado a lado, como Fixos e Avulsos em Gastos. O conteúdo da aba escolhida fica fora daqui. */
defineProps<{
  /** Nome do grupo para leitores de tela. */
  nome: string
  abas: readonly { valor: T; rotulo: string }[]
}>()
const valor = defineModel<T>({ required: true })
</script>

<template>
  <div class="abas" role="tablist" :aria-label="nome">
    <button
      v-for="aba in abas"
      :key="aba.valor"
      type="button"
      role="tab"
      class="aba"
      :aria-selected="valor === aba.valor"
      @click="valor = aba.valor"
    >
      {{ aba.rotulo }}
    </button>
  </div>
</template>

<style scoped>
.abas {
  padding: 4px;
  border-radius: 14px;
  background: var(--divisoria);
  display: flex;
  gap: 4px;
}

.aba {
  flex: 1;
  min-height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--texto-suave);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.aba[aria-selected='true'] {
  background: var(--superficie);
  color: var(--texto);
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
}
</style>

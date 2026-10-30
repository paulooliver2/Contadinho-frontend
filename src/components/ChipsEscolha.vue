<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'

/** Escolha única entre poucas opções, em chips (banco, filtro por pessoa...). */
defineProps<{
  rotulo: string
  opcoes: readonly { valor: T; rotulo: string }[]
  erro?: string
}>()
const valor = defineModel<T | null>({ required: true })

const idRotulo = useId()
const idErro = `${idRotulo}-erro`
</script>

<template>
  <div class="grupo" role="group" :aria-labelledby="idRotulo" :aria-describedby="erro ? idErro : undefined">
    <span :id="idRotulo" class="rotulo">{{ rotulo }}</span>
    <div class="chips">
      <button
        v-for="opcao in opcoes"
        :key="opcao.valor"
        type="button"
        class="chip"
        :aria-pressed="valor === opcao.valor"
        @click="valor = opcao.valor"
      >
        {{ opcao.rotulo }}
      </button>
    </div>
    <slot />
    <p v-if="erro" :id="idErro" class="erro">{{ erro }}</p>
  </div>
</template>

<style scoped>
.grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rotulo {
  font-size: 13px;
  font-weight: 600;
  color: var(--rotulo);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  min-height: 36px;
  padding: 0 12px;
  border-radius: 18px;
  border: 1px solid var(--borda);
  background: var(--superficie);
  color: var(--texto);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.chip[aria-pressed='true'] {
  border-color: var(--escuro);
  background: var(--escuro);
  color: var(--fundo);
}

.erro {
  margin: 0;
  font-size: 13px;
  color: var(--perigo);
}
</style>

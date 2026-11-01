<script setup lang="ts">
import { useId } from 'vue'

/** Liga e desliga uma opção, com o nome dela e, se houver, uma linha explicando (avisos, HU-28). */
defineProps<{ rotulo: string; descricao?: string }>()
const ligado = defineModel<boolean>({ required: true })

const id = useId()
</script>

<template>
  <div class="interruptor">
    <span class="textos">
      <span :id="`${id}-rotulo`" class="rotulo">{{ rotulo }}</span>
      <span v-if="descricao" :id="`${id}-descricao`" class="descricao">{{ descricao }}</span>
    </span>
    <button
      type="button"
      role="switch"
      class="botao"
      :aria-checked="ligado"
      :aria-labelledby="`${id}-rotulo`"
      :aria-describedby="descricao ? `${id}-descricao` : undefined"
      @click="ligado = !ligado"
    >
      <span class="bolinha" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.interruptor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: var(--toque-minimo);
}

.textos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.rotulo {
  font-size: 15px;
  font-weight: 600;
}

.descricao {
  font-size: 13px;
  color: var(--texto-suave);
}

.botao {
  flex: none;
  width: 48px;
  height: 28px;
  padding: 3px;
  border: none;
  border-radius: 14px;
  background: var(--borda);
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.botao[aria-checked='true'] {
  background: var(--marca);
}

.bolinha {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--superficie);
  transition: transform 0.15s;
}

.botao[aria-checked='true'] .bolinha {
  transform: translateX(20px);
}

@media (prefers-reduced-motion: reduce) {
  .botao,
  .bolinha {
    transition: none;
  }
}
</style>

<script setup lang="ts">
import { nextTick, ref, useId } from 'vue'

/** Texto de várias linhas, no mesmo visual do CampoTexto. `inserir` põe um trecho onde está o cursor. */
defineProps<{
  rotulo: string
  /** Mensagem embaixo do campo; também marca o campo como inválido para leitores de tela. */
  erro?: string
  maxlength?: number
  linhas?: number
}>()

const valor = defineModel<string>({ required: true })

const id = useId()
const idErro = `${id}-erro`
const area = ref<HTMLTextAreaElement | null>(null)

async function inserir(trecho: string) {
  const el = area.value
  const inicio = el?.selectionStart ?? valor.value.length
  const fim = el?.selectionEnd ?? valor.value.length
  valor.value = valor.value.slice(0, inicio) + trecho + valor.value.slice(fim)
  await nextTick()
  el?.focus()
  el?.setSelectionRange(inicio + trecho.length, inicio + trecho.length)
}

defineExpose({ inserir })
</script>

<template>
  <div class="campo">
    <label :for="id">{{ rotulo }}</label>
    <textarea
      :id="id"
      ref="area"
      v-model="valor"
      :rows="linhas ?? 5"
      :maxlength="maxlength"
      :aria-invalid="erro ? true : undefined"
      :aria-describedby="erro ? idErro : undefined"
      :class="{ invalido: erro }"
    />
    <p v-if="erro" :id="idErro" class="erro">{{ erro }}</p>
  </div>
</template>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  font-weight: 600;
  color: var(--rotulo);
}

textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--raio-campo);
  border: 1px solid var(--borda);
  background: var(--superficie);
  color: var(--texto);
  font: inherit;
  font-size: 15px;
  line-height: 1.45;
  resize: vertical;
}

textarea:focus-visible {
  outline: 2px solid var(--marca);
  outline-offset: 1px;
}

textarea.invalido {
  border-color: var(--perigo);
}

.erro {
  margin: 0;
  font-size: 13px;
  color: var(--perigo);
}
</style>

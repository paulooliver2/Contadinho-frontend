<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = defineProps<{
  rotulo: string
  tipo?: 'text' | 'email' | 'password' | 'date' | 'tel'
  autocomplete?: string
  placeholder?: string
  /** Mensagem embaixo do campo; também marca o campo como inválido para leitores de tela. */
  erro?: string
  /** Só dígitos (final do cartão, dia): teclado numérico e fonte de números. */
  numerico?: boolean
  /** Valor em reais: teclado com vírgula e fonte de números. */
  decimal?: boolean
  maxlength?: number
  /** Data máxima, em yyyy-MM-dd, quando `tipo` é date. */
  max?: string
}>()

const valor = defineModel<string>({ required: true })

const id = useId()
const idErro = `${id}-erro`
const senhaVisivel = ref(false)
const ehSenha = computed(() => props.tipo === 'password')
const tipoAtual = computed(() => (ehSenha.value && senhaVisivel.value ? 'text' : (props.tipo ?? 'text')))
</script>

<template>
  <div class="campo">
    <label :for="id">{{ rotulo }}</label>
    <div class="caixa">
      <input
        :id="id"
        v-model="valor"
        :type="tipoAtual"
        :autocomplete="autocomplete"
        :inputmode="numerico ? 'numeric' : decimal ? 'decimal' : tipo === 'email' ? 'email' : undefined"
        :autocapitalize="tipo === 'email' || ehSenha ? 'off' : undefined"
        :maxlength="maxlength"
        :max="max"
        :placeholder="placeholder"
        :aria-invalid="erro ? true : undefined"
        :aria-describedby="erro ? idErro : undefined"
        :class="{ 'com-botao': ehSenha, invalido: erro, numerico: numerico || decimal }"
      />
      <button
        v-if="ehSenha"
        type="button"
        class="olho"
        :aria-label="senhaVisivel ? 'Esconder senha' : 'Mostrar senha'"
        :aria-pressed="senhaVisivel"
        @click="senhaVisivel = !senhaVisivel"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
          <path v-if="senhaVisivel" d="M4 4l16 16" />
        </svg>
      </button>
    </div>
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

.caixa {
  position: relative;
}

input {
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border-radius: var(--raio-campo);
  border: 1px solid var(--borda);
  background: var(--superficie);
  color: var(--texto);
  font-size: 15px;
}

input:focus-visible {
  outline: 2px solid var(--marca);
  outline-offset: 1px;
}

input.com-botao {
  padding-right: 52px;
}

input.numerico {
  font-family: var(--fonte-numeros);
}

input.invalido {
  border-color: var(--perigo);
}

.olho {
  position: absolute;
  right: 2px;
  top: 2px;
  width: var(--toque-minimo);
  height: var(--toque-minimo);
  border: none;
  background: transparent;
  color: var(--texto-suave);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.erro {
  margin: 0;
  font-size: 13px;
  color: var(--perigo);
}
</style>

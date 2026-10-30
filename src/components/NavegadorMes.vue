<script setup lang="ts">
import { computed } from 'vue'
import { mesPorExtenso, somarMeses } from '@/lib/formatos'

/** ‹ mês › para andar entre faturas e resumos. O mês é yyyy-MM; `detalhe` aparece ao lado do nome (ex.: "aberta"). */
const props = defineProps<{ rotulo: string; detalhe?: string }>()
const mes = defineModel<string>({ required: true })

const nome = computed(() => mesPorExtenso(mes.value))
const anterior = computed(() => mesPorExtenso(somarMeses(mes.value, -1)))
const proximo = computed(() => mesPorExtenso(somarMeses(mes.value, 1)))
</script>

<template>
  <div class="navegador" role="group" :aria-label="props.rotulo">
    <button type="button" class="seta" :aria-label="`Ver ${anterior}`" @click="mes = somarMeses(mes, -1)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </button>
    <p class="mes" aria-live="polite">
      <span class="nome">{{ nome }}</span>
      <span v-if="detalhe" class="detalhe">{{ detalhe }}</span>
    </p>
    <button type="button" class="seta" :aria-label="`Ver ${proximo}`" @click="mes = somarMeses(mes, 1)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.navegador {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.seta {
  width: var(--toque-minimo);
  height: var(--toque-minimo);
  border-radius: 22px;
  border: 1px solid var(--borda);
  background: var(--superficie);
  color: var(--texto);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mes {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.nome {
  display: inline-block;
  font-size: 15px;
  font-weight: 600;
}

.nome::first-letter {
  text-transform: uppercase;
}

.detalhe {
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--marca-clara);
  color: var(--marca-escura);
  font-size: 11px;
  font-weight: 600;
}
</style>

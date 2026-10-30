<script setup lang="ts">
import { onMounted, ref, useId, watch } from 'vue'

/**
 * Folha que sobe de baixo (novo cartão, importar fatura...). Usa o <dialog> nativo: prende o foco dentro,
 * fecha com Esc e com toque fora. O conteúdo só existe enquanto está aberta, então cada abertura começa limpa.
 */
defineProps<{ titulo: string }>()
const aberta = defineModel<boolean>('aberta', { required: true })

const dialogo = ref<HTMLDialogElement>()
const idTitulo = useId()

function sincronizar(abrir: boolean) {
  const el = dialogo.value
  if (!el) return
  if (abrir && !el.open) el.showModal()
  if (!abrir && el.open) el.close()
}

watch(aberta, sincronizar)
onMounted(() => sincronizar(aberta.value))

function tocouFora(evento: MouseEvent) {
  // O clique no fundo escuro chega no próprio <dialog>; dentro do conteúdo, chega num filho.
  if (evento.target === dialogo.value) aberta.value = false
}
</script>

<template>
  <dialog ref="dialogo" class="folha" :aria-labelledby="idTitulo" @close="aberta = false" @click="tocouFora">
    <div v-if="aberta" class="conteudo">
      <header class="topo">
        <h2 :id="idTitulo">{{ titulo }}</h2>
        <button type="button" class="fechar" aria-label="Fechar" @click="aberta = false">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.folha {
  margin: auto 0 0;
  width: 100%;
  max-width: 100%;
  max-height: 94%;
  padding: 0;
  border: none;
  border-radius: 24px 24px 0 0;
  background: var(--superficie);
  color: var(--texto);
}

.folha::backdrop {
  background: rgb(16 25 21 / 0.45);
}

.conteudo {
  padding: 20px 20px calc(env(safe-area-inset-bottom) + 28px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.fechar {
  width: var(--toque-minimo);
  height: var(--toque-minimo);
  border-radius: 22px;
  border: none;
  background: var(--fundo);
  color: var(--texto);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>

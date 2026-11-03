<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import CampoTexto from '@/components/CampoTexto.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useCarteira, type CriptoEncontrada } from '@/stores/carteira'

/**
 * HU-30: a cripto só se escolhe do que a busca trouxe (CoinGecko), com pelo menos 2 letras e 400 ms depois da última
 * tecla. Fora do ar, a mensagem do servidor aparece e não há o que escolher.
 */
defineProps<{ erro?: string }>()
const escolhida = defineModel<CriptoEncontrada | null>({ required: true })

const loja = useCarteira()
const texto = ref('')
const resultados = ref<CriptoEncontrada[]>([])
const buscando = ref(false)
const falha = ref('')
let espera: ReturnType<typeof setTimeout> | undefined
/** Só a resposta da última busca vale: uma lenta não sobrescreve a mais nova. */
let ultima = 0

watch(texto, (atual) => {
  clearTimeout(espera)
  falha.value = ''
  const busca = atual.trim()
  if (busca.length < 2) {
    resultados.value = []
    buscando.value = false
    ultima++
    return
  }
  buscando.value = true
  espera = setTimeout(() => buscar(busca), 400)
})

async function buscar(busca: string) {
  const esta = ++ultima
  try {
    const lista = await loja.buscarCripto(busca)
    if (esta !== ultima) return
    resultados.value = lista
  } catch (e) {
    if (esta !== ultima) return
    resultados.value = []
    falha.value = mensagemDeErro(e)
  } finally {
    if (esta === ultima) buscando.value = false
  }
}

function escolher(c: CriptoEncontrada) {
  escolhida.value = c
  texto.value = ''
}

onBeforeUnmount(() => clearTimeout(espera))
</script>

<template>
  <div class="busca">
    <div v-if="escolhida" class="escolhida">
      <span><strong>{{ escolhida.nome }}</strong> ({{ escolhida.simbolo }})</span>
      <button type="button" class="trocar" @click="escolhida = null">Trocar</button>
    </div>
    <template v-else>
      <CampoTexto v-model="texto" rotulo="Cripto" placeholder="Busque pelo nome ou símbolo, como BTC" autocomplete="off" :maxlength="40" :erro="erro" />
      <TextoAjuda v-if="buscando">Buscando…</TextoAjuda>
      <TextoAjuda v-else-if="falha" tom="aviso">{{ falha }}</TextoAjuda>
      <TextoAjuda v-else-if="texto.trim().length >= 2 && resultados.length === 0">Nada encontrado. Confira o nome.</TextoAjuda>
      <ul v-if="resultados.length > 0 && !buscando" class="resultados" aria-label="Resultados da busca">
        <li v-for="c in resultados" :key="c.id">
          <button type="button" class="resultado" @click="escolher(c)">
            <span class="nome">{{ c.nome }}</span><span class="simbolo">{{ c.simbolo }}</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.busca {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.escolhida {
  min-height: var(--toque-minimo);
  padding: 8px 8px 8px 14px;
  border-radius: 12px;
  background: var(--fundo);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
}

.trocar {
  min-height: var(--toque-minimo);
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--marca);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.resultados {
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: 12px;
  background: var(--fundo);
  overflow: hidden;
}

.resultado {
  width: 100%;
  min-height: var(--toque-minimo);
  padding: 0 14px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

li + li .resultado {
  border-top: 1px solid var(--divisoria);
}

.simbolo {
  color: var(--texto-suave);
  font-size: 12px;
}
</style>

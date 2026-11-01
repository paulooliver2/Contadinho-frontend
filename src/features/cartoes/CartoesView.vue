<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CabecalhoAba from '@/components/CabecalhoAba.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import IconeCartao from '@/components/IconeCartao.vue'
import { useAvisos } from '@/stores/avisos'
import { useCartoes, type Cartao } from '@/stores/cartoes'
import FaturaCartao from './FaturaCartao.vue'
import NovoCartaoFolha from './NovoCartaoFolha.vue'
import ResumoCartao from './ResumoCartao.vue'
import SeletorCartoes from './SeletorCartoes.vue'

const cartoes = useCartoes()
// Vindo do card de fatura do Início: abre aquele cartão, naquela fatura.
const route = useRoute()
const doLink = (nome: string) => (typeof route.query[nome] === 'string' ? (route.query[nome] as string) : undefined)
const selecionadoId = ref<string | null>(doLink('cartao') ?? null)
const mesDoLink = doLink('fatura')
const folhaAberta = ref(false)
const aviso = ref('')
const erroCarga = ref('')

const selecionado = computed(() => cartoes.lista.find((c) => c.id === selecionadoId.value) ?? cartoes.lista[0] ?? null)

async function carregar() {
  erroCarga.value = ''
  try {
    await cartoes.carregar()
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  }
}

onMounted(carregar)

const avisos = useAvisos()

function aoCadastrar(cartao: Cartao) {
  // HU-25.1: o primeiro cartão também é hora de explicar os avisos.
  avisos.oferecer()
  selecionadoId.value = cartao.id
  aviso.value = `${cartao.apelido} •• ${cartao.ultimos4} cadastrado.`
}
</script>

<template>
  <div class="tela">
    <CabecalhoAba titulo="Cartões" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <EstadoVazio
      v-else-if="cartoes.carregado && cartoes.lista.length === 0"
      titulo="Nenhum cartão ainda"
      texto="Cadastre o cartão que você divide com a família. Depois é só importar a fatura e marcar de quem é cada compra."
    >
      <template #icone><IconeCartao :tamanho="28" /></template>
      <template #acao><BotaoAcao @click="folhaAberta = true">Cadastrar cartão</BotaoAcao></template>
    </EstadoVazio>

    <template v-else-if="selecionado">
      <SeletorCartoes
        :model-value="selecionado.id"
        :cartoes="cartoes.lista"
        @update:model-value="selecionadoId = $event"
        @adicionar="folhaAberta = true"
      />
      <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />
      <ResumoCartao :cartao="selecionado" />
      <FaturaCartao
        :key="selecionado.id"
        :cartao="selecionado"
        :mes-inicial="selecionado.id === doLink('cartao') ? mesDoLink : undefined"
      />
    </template>

    <NovoCartaoFolha v-model:aberta="folhaAberta" @cadastrado="aoCadastrar" />
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>

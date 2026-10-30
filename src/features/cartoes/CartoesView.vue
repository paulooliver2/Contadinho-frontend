<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CabecalhoAba from '@/components/CabecalhoAba.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import IconeCartao from '@/components/IconeCartao.vue'
import { useCartoes, type Cartao } from '@/stores/cartoes'
import NovoCartaoFolha from './NovoCartaoFolha.vue'
import ResumoCartao from './ResumoCartao.vue'
import SeletorCartoes from './SeletorCartoes.vue'

const cartoes = useCartoes()
const selecionadoId = ref<string | null>(null)
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

function aoCadastrar(cartao: Cartao) {
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

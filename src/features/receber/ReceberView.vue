<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CabecalhoAba from '@/components/CabecalhoAba.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import IconePessoas from '@/components/IconePessoas.vue'
import { usePessoas, type Pessoa } from '@/stores/pessoas'
import LinhaPessoa from './LinhaPessoa.vue'
import PessoaFolha from './PessoaFolha.vue'

/** A receber: por enquanto, as pessoas do dono (HU-16, HU-42). Saldos e cobranças vêm com HU-17 a HU-21. */
const pessoas = usePessoas()
const folhaAberta = ref(false)
const editando = ref<Pessoa | null>(null)
const verArquivadas = ref(false)
const aviso = ref('')
const erroCarga = ref('')

async function carregar() {
  erroCarga.value = ''
  try {
    await pessoas.carregar()
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  }
}

onMounted(carregar)

function abrir(pessoa: Pessoa | null) {
  editando.value = pessoa
  folhaAberta.value = true
}

function aoSalvar(mensagem: string) {
  aviso.value = mensagem
  if (pessoas.arquivadas.length === 0) verArquivadas.value = false
}
</script>

<template>
  <div class="tela">
    <CabecalhoAba titulo="A receber" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="pessoas.carregado">
      <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />

      <EstadoVazio
        v-if="pessoas.ativas.length === 0"
        titulo="Nenhuma pessoa ainda"
        texto="Cadastre quem usa seu cartão ou pega dinheiro emprestado, com o WhatsApp, para atribuir compras e cobrar sem procurar o contato."
      >
        <template #icone><IconePessoas :tamanho="28" /></template>
        <template #acao><BotaoAcao @click="abrir(null)">Cadastrar pessoa</BotaoAcao></template>
      </EstadoVazio>

      <template v-else>
        <ul class="lista" aria-label="Pessoas">
          <LinhaPessoa v-for="p in pessoas.ativas" :key="p.id" :pessoa="p" @abrir="abrir(p)" />
        </ul>
        <BotaoAcao @click="abrir(null)">Adicionar pessoa</BotaoAcao>
      </template>

      <template v-if="pessoas.arquivadas.length > 0">
        <button type="button" class="alternar" :aria-expanded="verArquivadas" @click="verArquivadas = !verArquivadas">
          {{ verArquivadas ? 'Esconder arquivadas' : `Ver arquivadas (${pessoas.arquivadas.length})` }}
        </button>
        <ul v-if="verArquivadas" class="lista" aria-label="Pessoas arquivadas">
          <LinhaPessoa v-for="p in pessoas.arquivadas" :key="p.id" :pessoa="p" @abrir="abrir(p)" />
        </ul>
      </template>
    </template>

    <p v-else class="carregando" role="status">Carregando pessoas…</p>

    <PessoaFolha v-model:aberta="folhaAberta" :editando="editando" @salvo="aoSalvar" />
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lista {
  margin: 0;
  padding: 0;
  border-radius: var(--raio-card);
  background: var(--superficie);
  overflow: hidden;
}

.alternar {
  align-self: center;
  min-height: var(--toque-minimo);
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--marca);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  text-align: center;
}
</style>

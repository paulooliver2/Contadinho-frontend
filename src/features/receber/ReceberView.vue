<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CabecalhoAba from '@/components/CabecalhoAba.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CartaoResumo from '@/components/CartaoResumo.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import IconePessoas from '@/components/IconePessoas.vue'
import { reais } from '@/lib/formatos'
import { usePessoas, type Pessoa } from '@/stores/pessoas'
import EmprestimoFolha from './EmprestimoFolha.vue'
import LinhaPessoa from './LinhaPessoa.vue'
import PessoaFolha from './PessoaFolha.vue'
import { buscarResumo, type Resumo, type Situacao } from './receber'

/**
 * A receber (HU-18): quanto falta receber, quanto já foi recebido e as pessoas, de quem vence primeiro para quem
 * não deve nada. Tocar numa pessoa abre o histórico dela; o cadastro é o da HU-16 e o empréstimo, o da HU-17.
 */
const router = useRouter()
const pessoas = usePessoas()
const resumo = ref<Resumo | null>(null)
const folhaAberta = ref(false)
const emprestimoAberto = ref(false)
const verArquivadas = ref(false)
const aviso = ref('')
const erroCarga = ref('')

async function carregar() {
  erroCarga.value = ''
  try {
    const [lido] = await Promise.all([buscarResumo(), pessoas.carregar()])
    resumo.value = lido
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  }
}

onMounted(carregar)

const situacoes = computed(() => new Map((resumo.value?.pessoas ?? []).map((s) => [s.pessoaId, s])))

/** Primeiro quem tem algo registrado, na ordem do servidor (vencimento mais próximo); depois os outros, por nome. */
const ativas = computed(() => {
  const ordem = (resumo.value?.pessoas ?? []).map((s) => s.pessoaId)
  const posicao = (p: Pessoa) => {
    const i = ordem.indexOf(p.id)
    return i < 0 ? ordem.length : i
  }
  return [...pessoas.ativas].sort((a, b) => posicao(a) - posicao(b))
})

function situacao(p: Pessoa): Situacao | undefined {
  return situacoes.value.get(p.id)
}

function abrir(p: Pessoa) {
  router.push({ name: 'pessoa', params: { id: p.id } })
}

function aoSalvar(mensagem: string) {
  aviso.value = mensagem
}

function aoRegistrar(mensagem: string) {
  aviso.value = mensagem
  carregar()
}
</script>

<template>
  <div class="tela">
    <CabecalhoAba titulo="A receber" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="resumo && pessoas.carregado">
      <CartaoResumo rotulo="Falta receber" :valor="reais(resumo.aReceber)" nome="Resumo a receber">
        <p class="recebido">Já recebido: {{ reais(resumo.recebido) }}</p>
      </CartaoResumo>

      <BotaoAcao @click="emprestimoAberto = true">Registrar valor emprestado</BotaoAcao>

      <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />

      <EstadoVazio
        v-if="pessoas.ativas.length === 0"
        titulo="Nenhuma pessoa ainda"
        texto="Cadastre quem usa seu cartão ou pega dinheiro emprestado, com o WhatsApp, para atribuir compras e cobrar sem procurar o contato."
      >
        <template #icone><IconePessoas :tamanho="28" /></template>
        <template #acao><BotaoAcao @click="folhaAberta = true">Cadastrar pessoa</BotaoAcao></template>
      </EstadoVazio>

      <template v-else>
        <ul class="lista" aria-label="Pessoas">
          <LinhaPessoa v-for="p in ativas" :key="p.id" :pessoa="p" :situacao="situacao(p)" @abrir="abrir(p)" />
        </ul>
        <BotaoAcao variante="secundario" @click="folhaAberta = true">Adicionar pessoa</BotaoAcao>
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

    <p v-else class="carregando" role="status">Carregando…</p>

    <PessoaFolha v-model:aberta="folhaAberta" :editando="null" @salvo="aoSalvar" />
    <EmprestimoFolha v-model:aberta="emprestimoAberto" @salvo="aoRegistrar" />
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recebido {
  font-size: 12px;
  color: var(--escuro-texto-suave);
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

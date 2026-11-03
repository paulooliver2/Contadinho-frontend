<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import BotaoNovo from '@/components/BotaoNovo.vue'
import CabecalhoAba from '@/components/CabecalhoAba.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CartaoResumo from '@/components/CartaoResumo.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import { reais } from '@/lib/formatos'
import { useCarteira, type PosicaoDetalhe, type PosicaoResumo, type TipoInvestimento } from '@/stores/carteira'
import { ROTULOS_TIPO, titulo } from './formatos'
import GanhoTexto from './GanhoTexto.vue'
import LinhaPosicao from './LinhaPosicao.vue'
import NovoInvestimentoFolha from './NovoInvestimentoFolha.vue'

/** HU-30: a carteira agrupada por tipo, com o total aplicado no topo e as encerradas recolhidas no fim. */
const router = useRouter()
const loja = useCarteira()
const erroCarga = ref('')
const folhaAberta = ref(false)
const verEncerradas = ref(false)
const aviso = ref<{ mensagem: string; tom: 'erro' | 'sucesso' } | null>(null)

/** HU-31: primeiro o que está guardado, na hora; depois as cotações velhas, sem travar a tela. */
async function carregar() {
  erroCarga.value = ''
  try {
    await loja.carregar()
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
    return
  }
  loja.atualizar()
}

onMounted(carregar)

const ORDEM: TipoInvestimento[] = ['ACAO', 'CRIPTO', 'TESOURO', 'RENDA_FIXA']

const posicoes = computed(() => loja.carteira?.posicoes ?? [])
const encerradas = computed(() => posicoes.value.filter((p) => p.encerrada))

const grupos = computed(() =>
  ORDEM.map((tipo) => ({
    tipo,
    rotulo: ROTULOS_TIPO[tipo],
    posicoes: posicoes.value.filter((p) => p.tipo === tipo && !p.encerrada),
  })).filter((g) => g.posicoes.length > 0),
)

function abrir(p: PosicaoResumo) {
  router.push({ name: 'posicao', params: { id: p.id } })
}

function aoSalvar(p: PosicaoDetalhe) {
  aviso.value = p.conferido
    ? { mensagem: `Investimento cadastrado: ${titulo(p)}.`, tom: 'sucesso' }
    : { mensagem: 'Não deu para conferir agora. O ativo foi salvo e será conferido depois.', tom: 'erro' }
}
</script>

<template>
  <div class="tela">
    <CabecalhoAba titulo="Carteira">
      <template v-if="posicoes.length > 0" #acoes>
        <BotaoNovo texto="Novo investimento" @click="folhaAberta = true" />
      </template>
    </CabecalhoAba>

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="loja.carteira">
      <CaixaAviso v-if="aviso" :tom="aviso.tom" fechavel :mensagem="aviso.mensagem" @fechar="aviso = null" />

      <EstadoVazio
        v-if="posicoes.length === 0"
        titulo="Nenhum investimento ainda"
        texto="Cadastre o que você tem hoje em ações, cripto, Tesouro e renda fixa para ver tudo num lugar só."
      >
        <template #acao><BotaoAcao @click="folhaAberta = true">Novo investimento</BotaoAcao></template>
      </EstadoVazio>

      <template v-else>
        <CartaoResumo rotulo="Patrimônio" :valor="reais(loja.carteira.patrimonio)" nome="Resumo da carteira" :ocupado="loja.atualizando">
          <p class="linha-resumo">
            <GanhoTexto v-if="loja.carteira.patrimonio > 0" escuro :valor="loja.carteira.ganho" :percentual="loja.carteira.ganhoPercentual" />
            <span class="aplicado">Aplicado: {{ reais(loja.carteira.totalAplicado) }}</span>
          </p>
          <p v-if="loja.atualizando" class="status" role="status">Atualizando…</p>
          <p v-else-if="loja.erroAtualizacao" class="status" role="status">{{ loja.erroAtualizacao }}</p>
          <p v-if="loja.carteira.semCotacao > 0" class="status">
            {{ loja.carteira.semCotacao === 1 ? '1 ativo sem cotação ainda, fora do patrimônio.' : `${loja.carteira.semCotacao} ativos sem cotação ainda, fora do patrimônio.` }}
          </p>
        </CartaoResumo>

        <section v-for="g in grupos" :key="g.tipo" class="grupo" :aria-labelledby="`grupo-${g.tipo}`">
          <h2 :id="`grupo-${g.tipo}`" class="secao">{{ g.rotulo }}</h2>
          <ul class="lista">
            <LinhaPosicao v-for="p in g.posicoes" :key="p.id" :posicao="p" @abrir="abrir(p)" />
          </ul>
        </section>

        <template v-if="encerradas.length > 0">
          <button type="button" class="alternar" :aria-expanded="verEncerradas" @click="verEncerradas = !verEncerradas">
            {{ verEncerradas ? 'Esconder encerradas' : `Encerradas (${encerradas.length})` }}
          </button>
          <ul v-if="verEncerradas" class="lista" aria-label="Encerradas">
            <LinhaPosicao v-for="p in encerradas" :key="p.id" :posicao="p" @abrir="abrir(p)" />
          </ul>
        </template>
      </template>
    </template>

    <p v-else class="carregando" role="status">Carregando…</p>

    <NovoInvestimentoFolha v-model:aberta="folhaAberta" @salvo="aoSalvar" />
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.linha-resumo {
  margin: 4px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: baseline;
}

.aplicado,
.status {
  font-size: 12px;
  color: var(--escuro-texto-suave);
}

.status {
  margin: 4px 0 0;
}

.grupo {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.secao {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rotulo);
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

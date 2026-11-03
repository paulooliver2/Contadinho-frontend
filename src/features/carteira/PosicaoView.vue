<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CartaoResumo from '@/components/CartaoResumo.vue'
import LinhaValor from '@/components/LinhaValor.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { hojeIso, reais } from '@/lib/formatos'
import { useCarteira, type PosicaoDetalhe } from '@/stores/carteira'
import { dataCompleta, ganho as ganhoTexto, preco, quantidade, taxa, titulo } from './formatos'
import GanhoTexto from './GanhoTexto.vue'
import HoraCotacao from './HoraCotacao.vue'
import LinhaMovimentacao from './LinhaMovimentacao.vue'
import MovimentacaoFolha from './MovimentacaoFolha.vue'

/** HU-30: o que a posição tem hoje, as movimentações e os botões de aportar, resgatar e excluir. */
const props = defineProps<{ id: string }>()

const router = useRouter()
const loja = useCarteira()
const posicao = ref<PosicaoDetalhe | null>(null)
const erroCarga = ref('')
const aviso = ref('')
const erroAcao = ref('')
const folha = ref<'APORTE' | 'RESGATE' | null>(null)
const folhaAberta = ref(false)
const excluindo = ref<string | null>(null)
const confirmandoExclusao = ref(false)
const excluindoPosicao = ref(false)

/** HU-31: mostra o guardado na hora e, depois de atualizar as cotações velhas, relê a posição. */
async function carregar() {
  erroCarga.value = ''
  try {
    posicao.value = await loja.detalhe(props.id)
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
    return
  }
  await loja.atualizar()
  if (loja.erroAtualizacao) return
  try {
    posicao.value = await loja.detalhe(props.id)
  } catch {
    // Fica o que já estava na tela.
  }
}

watch(() => props.id, carregar, { immediate: true })

const nome = computed(() => (posicao.value ? titulo(posicao.value) : ''))
const rendaFixa = computed(() => posicao.value?.tipo === 'RENDA_FIXA')

const vencida = computed(() => {
  const p = posicao.value
  return !!p && p.tipo === 'RENDA_FIXA' && !p.encerrada && !!p.vencimento && p.vencimento < hojeIso()
})

const subtitulo = computed(() => {
  const p = posicao.value
  if (!p) return ''
  if (p.tipo === 'ACAO') return p.codigo
  if (p.tipo === 'CRIPTO') return p.simbolo ?? p.codigo
  if (p.tipo === 'TESOURO') return 'Tesouro Direto'
  return 'Renda fixa'
})

function abrirFolha(tipo: 'APORTE' | 'RESGATE') {
  folha.value = tipo
  folhaAberta.value = true
}

function aoSalvar(atualizada: PosicaoDetalhe, mensagem: string) {
  posicao.value = atualizada
  erroAcao.value = ''
  aviso.value = mensagem
}

async function excluirMovimentacao(movimentacaoId: string) {
  if (excluindo.value || !posicao.value) return
  excluindo.value = movimentacaoId
  erroAcao.value = ''
  aviso.value = ''
  try {
    posicao.value = await loja.excluirMovimentacao(posicao.value.id, movimentacaoId)
    aviso.value = 'Movimentação excluída.'
  } catch (e) {
    erroAcao.value = mensagemDeErro(e)
  } finally {
    excluindo.value = null
  }
}

async function excluirPosicao() {
  if (!posicao.value || excluindoPosicao.value) return
  if (!confirmandoExclusao.value) {
    confirmandoExclusao.value = true
    return
  }
  excluindoPosicao.value = true
  erroAcao.value = ''
  try {
    await loja.excluir(posicao.value.id)
    router.replace({ name: 'carteira' })
  } catch (e) {
    erroAcao.value = mensagemDeErro(e)
  } finally {
    excluindoPosicao.value = false
    confirmandoExclusao.value = false
  }
}
</script>

<template>
  <div class="tela">
    <BotaoVoltar :para="{ name: 'carteira' }" rotulo="Voltar para a Carteira" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="posicao">
      <header class="cabecalho">
        <h1>{{ nome }}</h1>
        <p class="subtitulo">{{ subtitulo }}</p>
      </header>

      <CartaoResumo v-if="posicao.encerrada" :rotulo="rendaFixa ? 'Resultado' : 'Aplicado'" :valor="rendaFixa ? ganhoTexto(posicao.resultado ?? 0) : reais(posicao.aplicado)" :nome="`Resumo de ${nome}`">
        <p class="nota">Encerrada · aplicado {{ reais(posicao.aplicadoInicial) }}</p>
      </CartaoResumo>
      <CartaoResumo v-else rotulo="Valor hoje" :valor="reais(posicao.valorAtual ?? posicao.aplicado)" :nome="`Resumo de ${nome}`" :ocupado="loja.atualizando">
        <p class="nota">
          <GanhoTexto v-if="posicao.ganho != null" escuro :valor="posicao.ganho" :percentual="posicao.ganhoPercentual" />
          <span>Aplicado: {{ reais(posicao.aplicado) }}</span>
        </p>
        <p v-if="loja.atualizando" class="nota" role="status">Atualizando…</p>
        <p v-else-if="loja.erroAtualizacao" class="nota" role="status">{{ loja.erroAtualizacao }}</p>
      </CartaoResumo>

      <section class="dados" aria-label="Dados da posição">
        <template v-if="rendaFixa">
          <LinhaValor rotulo="Rentabilidade" :valor="taxa(posicao)" />
          <LinhaValor v-if="posicao.vencimento" rotulo="Vencimento" :valor="dataCompleta(posicao.vencimento)" />
        </template>
        <template v-else>
          <LinhaValor rotulo="Quantidade" :valor="quantidade(posicao, posicao.quantidade ?? 0)" />
          <LinhaValor v-if="posicao.precoMedio" rotulo="Preço médio" :valor="preco(posicao.precoMedio)" />
          <LinhaValor v-if="posicao.cotacao != null && !posicao.encerrada" rotulo="Cotação" :valor="preco(posicao.cotacao)" />
        </template>
      </section>
      <HoraCotacao :posicao="posicao" />

      <TextoAjuda v-if="vencida && posicao.vencimento" tom="aviso">
        Venceu em {{ dataCompleta(posicao.vencimento) }}. Quando o dinheiro cair na conta, toque em Resgatar e marque "Resgatei tudo".
      </TextoAjuda>
      <TextoAjuda v-if="!posicao.conferido" tom="aviso">Não deu para conferir este código na B3 ainda. Ele será conferido depois.</TextoAjuda>

      <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />
      <CaixaAviso :mensagem="erroAcao" />

      <div class="acoes">
        <BotaoAcao v-if="!rendaFixa" @click="abrirFolha('APORTE')">Aportar</BotaoAcao>
        <BotaoAcao v-if="!posicao.encerrada" :variante="rendaFixa ? 'principal' : 'secundario'" @click="abrirFolha('RESGATE')">Resgatar</BotaoAcao>
      </div>

      <h2 class="secao">Movimentações</h2>
      <ul class="lista" aria-label="Movimentações">
        <LinhaMovimentacao
          v-for="m in [...posicao.movimentacoes].reverse()"
          :key="m.id"
          :movimentacao="m"
          :posicao="posicao"
          :excluindo="excluindo === m.id"
          @excluir="excluirMovimentacao(m.id)"
        />
      </ul>

      <BotaoAcao variante="secundario" :carregando="excluindoPosicao" texto-carregando="Excluindo…" @click="excluirPosicao" @blur="confirmandoExclusao = false">
        {{ confirmandoExclusao ? 'Toque de novo para excluir' : 'Excluir investimento' }}
      </BotaoAcao>
      <TextoAjuda>Excluir apaga a posição e todas as movimentações dela.</TextoAjuda>

      <MovimentacaoFolha v-if="folha" v-model:aberta="folhaAberta" :posicao="posicao" :tipo="folha" @salvo="aoSalvar" />
    </template>

    <p v-else class="carregando" role="status">Carregando…</p>
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cabecalho h1 {
  margin: 0;
  font-size: 22px;
}

.subtitulo {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--texto-suave);
}

.nota {
  margin: 4px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  font-size: 12px;
  color: var(--escuro-texto-suave);
}

.dados {
  padding: 4px 16px;
  border-radius: var(--raio-card);
  background: var(--superficie);
}

.acoes {
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

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  text-align: center;
}
</style>

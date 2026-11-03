<script setup lang="ts">
import { ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import LinhaCampos from '@/components/LinhaCampos.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { hojeIso, lerValor } from '@/lib/formatos'
import {
  useCarteira,
  type CriptoEncontrada,
  type NovoInvestimento,
  type PosicaoDetalhe,
  type TipoInvestimento,
} from '@/stores/carteira'
import BuscaCripto from './BuscaCripto.vue'
import { CASAS_PRECO, CASAS_QUANTIDADE, lerNumero } from './formatos'

/**
 * HU-30: cadastrar a posição de hoje. Os campos mudam pelo tipo; ação, cripto e Tesouro entram com a data de hoje,
 * a renda fixa com a data da aplicação.
 */
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [posicao: PosicaoDetalhe] }>()

const loja = useCarteira()

type TituloTesouro = NonNullable<NovoInvestimento['tesouroTipo']>
type Produto = NonNullable<NovoInvestimento['produto']>
type Indexador = NonNullable<NovoInvestimento['indexador']>

const tipos: { valor: TipoInvestimento; rotulo: string }[] = [
  { valor: 'ACAO', rotulo: 'Ação ou FII' },
  { valor: 'CRIPTO', rotulo: 'Cripto' },
  { valor: 'TESOURO', rotulo: 'Tesouro' },
  { valor: 'RENDA_FIXA', rotulo: 'CDB, LCI, LCA' },
]

const titulos: { valor: TituloTesouro; rotulo: string }[] = [
  { valor: 'SELIC', rotulo: 'Selic' },
  { valor: 'IPCA', rotulo: 'IPCA+' },
  { valor: 'IPCA_JUROS', rotulo: 'IPCA+ com juros' },
  { valor: 'PREFIXADO', rotulo: 'Prefixado' },
  { valor: 'PREFIXADO_JUROS', rotulo: 'Prefixado com juros' },
  { valor: 'RENDA_MAIS', rotulo: 'Renda+' },
  { valor: 'EDUCA_MAIS', rotulo: 'Educa+' },
]

const produtos: { valor: Produto; rotulo: string }[] = [
  { valor: 'CDB', rotulo: 'CDB' },
  { valor: 'LCI', rotulo: 'LCI' },
  { valor: 'LCA', rotulo: 'LCA' },
]

const indexadores: { valor: Indexador; rotulo: string }[] = [
  { valor: 'CDI', rotulo: '% do CDI' },
  { valor: 'PREFIXADO', rotulo: 'Prefixado (% ao ano)' },
]

const tipo = ref<TipoInvestimento | null>(null)
const ticker = ref('')
/** HU-32: Ação/ETF ou FII, para a distribuição por classe. */
const classe = ref<'ACAO' | 'FII' | null>('ACAO')
const classes = [
  { valor: 'ACAO', rotulo: 'Ação/ETF' },
  { valor: 'FII', rotulo: 'FII' },
] as const
const cripto = ref<CriptoEncontrada | null>(null)
const quantidade = ref('')
const preco = ref('')
const valor = ref('')
const tesouroTipo = ref<TituloTesouro | null>(null)
const tesouroAno = ref('')
const produto = ref<Produto | null>(null)
const emissor = ref('')
const dataAplicacao = ref('')
const indexador = ref<Indexador | null>(null)
const taxa = ref('')
const vencimento = ref('')
const erros = useErrosDeCampos({
  tipo,
  codigo: [ticker, cripto],
  quantidade,
  preco,
  valor,
  tesouroTipo,
  tesouroAno,
  produto,
  emissor,
  dataAplicacao,
  indexador,
  taxa,
  vencimento,
})
const erro = ref('')
const enviando = ref(false)

watch(aberta, (abriu) => {
  if (!abriu) return
  tipo.value = null
  ticker.value = ''
  classe.value = 'ACAO'
  cripto.value = null
  quantidade.value = ''
  preco.value = ''
  valor.value = ''
  tesouroTipo.value = null
  tesouroAno.value = ''
  produto.value = null
  emissor.value = ''
  dataAplicacao.value = hojeIso()
  indexador.value = null
  taxa.value = ''
  vencimento.value = ''
  erros.value = {}
  erro.value = ''
})

// O ticker aparece como a B3 escreve.
watch(ticker, (atual) => {
  const maiusculo = atual.toUpperCase()
  if (maiusculo !== atual) ticker.value = maiusculo
})

const INFORME = 'Informe um valor maior que zero.'

/** Avisa antes de enviar o que dá para ver aqui; o resto (ticker, datas, repetido) o servidor responde. */
function montar(): NovoInvestimento | null {
  const novos: Record<string, string> = {}
  const t = tipo.value
  if (!t) {
    erros.value = { tipo: 'Escolha o tipo.' }
    return null
  }
  const pedido: NovoInvestimento = { tipo: t }
  const numero = (campo: string, texto: string, casas: number) => {
    const n = lerNumero(texto, casas)
    if (n === null) novos[campo] = casas === 0 && lerNumero(texto, 8) !== null ? 'Use um número inteiro.' : INFORME
    return n ?? undefined
  }
  if (t === 'ACAO' || t === 'CRIPTO') {
    if (t === 'ACAO') {
      if (!ticker.value.trim()) novos.codigo = 'Informe o código, como PETR4.'
      pedido.codigo = ticker.value.trim()
      pedido.fii = classe.value === 'FII'
    } else {
      if (!cripto.value) novos.codigo = 'Escolha a cripto na busca.'
      pedido.codigo = cripto.value?.id
    }
    pedido.quantidade = numero('quantidade', quantidade.value, CASAS_QUANTIDADE[t])
    pedido.preco = numero('preco', preco.value, CASAS_PRECO)
  } else if (t === 'TESOURO') {
    if (!tesouroTipo.value) novos.tesouroTipo = 'Escolha o título.'
    const ano = Number(tesouroAno.value)
    if (!/^\d{4}$/.test(tesouroAno.value.trim())) novos.tesouroAno = 'Informe o ano de vencimento, como 2035.'
    pedido.tesouroTipo = tesouroTipo.value ?? undefined
    pedido.tesouroAno = ano
    pedido.quantidade = numero('quantidade', quantidade.value, CASAS_QUANTIDADE.TESOURO)
    const v = lerValor(valor.value)
    if (v === null || v <= 0) novos.valor = INFORME
    pedido.valor = v ?? undefined
  } else {
    if (!produto.value) novos.produto = 'Escolha CDB, LCI ou LCA.'
    if (!emissor.value.trim()) novos.emissor = 'Informe o banco emissor.'
    const v = lerValor(valor.value)
    if (v === null || v <= 0) novos.valor = INFORME
    if (!dataAplicacao.value) novos.dataAplicacao = 'Informe a data da aplicação.'
    if (!indexador.value) novos.indexador = 'Escolha % do CDI ou prefixado.'
    if (!vencimento.value) novos.vencimento = 'Informe o vencimento.'
    pedido.produto = produto.value ?? undefined
    pedido.emissor = emissor.value.trim()
    pedido.valor = v ?? undefined
    pedido.dataAplicacao = dataAplicacao.value
    pedido.indexador = indexador.value ?? undefined
    pedido.taxa = numero('taxa', taxa.value, 4)
    pedido.vencimento = vencimento.value
  }
  erros.value = novos
  return Object.keys(novos).length > 0 ? null : pedido
}

async function salvar() {
  if (enviando.value) return
  const pedido = montar()
  if (!pedido) return
  enviando.value = true
  erro.value = ''
  try {
    emit('salvo', await loja.criar(pedido))
    aberta.value = false
  } catch (e) {
    if (e instanceof ErroApi && Object.keys(e.campos).length > 0) erros.value = e.campos
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" titulo="Novo investimento">
    <FormularioEmpilhado @enviar="salvar">
      <ChipsEscolha v-model="tipo" rotulo="O que é" :opcoes="tipos" :erro="erros.tipo" />

      <template v-if="tipo === 'ACAO'">
        <CampoTexto v-model="ticker" rotulo="Código na B3" placeholder="Ex.: PETR4 ou BOVA11" :maxlength="12" autocomplete="off" :erro="erros.codigo" />
        <ChipsEscolha v-model="classe" rotulo="Classe" :opcoes="classes" />
        <LinhaCampos>
          <CampoTexto v-model="quantidade" rotulo="Quantidade" numerico placeholder="100" :erro="erros.quantidade" />
          <CampoTexto v-model="preco" rotulo="Preço médio (R$)" decimal placeholder="30,00" :erro="erros.preco" />
        </LinhaCampos>
        <TextoAjuda>Use o preço médio da corretora. A data é hoje: o que você tem agora.</TextoAjuda>
      </template>

      <template v-else-if="tipo === 'CRIPTO'">
        <BuscaCripto v-model="cripto" :erro="erros.codigo" />
        <LinhaCampos>
          <CampoTexto v-model="quantidade" rotulo="Quantidade" decimal placeholder="0,005" :erro="erros.quantidade" />
          <CampoTexto v-model="preco" rotulo="Preço médio (R$)" decimal placeholder="350.000,00" :erro="erros.preco" />
        </LinhaCampos>
      </template>

      <template v-else-if="tipo === 'TESOURO'">
        <ChipsEscolha v-model="tesouroTipo" rotulo="Título" :opcoes="titulos" :erro="erros.tesouroTipo" />
        <CampoTexto v-model="tesouroAno" rotulo="Ano de vencimento" numerico placeholder="2035" :maxlength="4" :erro="erros.tesouroAno" />
        <LinhaCampos>
          <CampoTexto v-model="quantidade" rotulo="Quantidade" decimal placeholder="1,37" :erro="erros.quantidade" />
          <CampoTexto v-model="valor" rotulo="Valor aplicado (R$)" decimal placeholder="4.500,00" :erro="erros.valor" />
        </LinhaCampos>
        <TextoAjuda>Copie do extrato do Tesouro Direto ou da corretora.</TextoAjuda>
      </template>

      <template v-else-if="tipo === 'RENDA_FIXA'">
        <ChipsEscolha v-model="produto" rotulo="Produto" :opcoes="produtos" :erro="erros.produto" />
        <CampoTexto v-model="emissor" rotulo="Banco emissor" placeholder="Ex.: Banco X" :maxlength="80" autocomplete="off" :erro="erros.emissor" />
        <LinhaCampos>
          <CampoTexto v-model="valor" rotulo="Valor aplicado (R$)" decimal placeholder="10.000,00" :erro="erros.valor" />
          <CampoTexto v-model="dataAplicacao" rotulo="Data da aplicação" tipo="date" :max="hojeIso()" :erro="erros.dataAplicacao" />
        </LinhaCampos>
        <ChipsEscolha v-model="indexador" rotulo="Rentabilidade" :opcoes="indexadores" :erro="erros.indexador" />
        <LinhaCampos>
          <CampoTexto v-model="taxa" :rotulo="indexador === 'PREFIXADO' ? 'Taxa (% ao ano)' : 'Taxa (% do CDI)'" decimal placeholder="110" :erro="erros.taxa" />
          <CampoTexto v-model="vencimento" rotulo="Vencimento" tipo="date" :erro="erros.vencimento" />
        </LinhaCampos>
      </template>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao v-if="tipo" tipo="submit" :carregando="enviando" texto-carregando="Salvando…">Salvar investimento</BotaoAcao>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

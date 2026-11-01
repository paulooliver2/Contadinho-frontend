<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import LinhaCampos from '@/components/LinhaCampos.vue'
import QuadroResumo from '@/components/QuadroResumo.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { hojeIso, lerValor, mesPorExtenso, reais, somarMeses, valorParaCampo } from '@/lib/formatos'
import { alterarReceita, cadastrarReceita, encerrarReceita, excluirReceita, type DadosReceita, type Receita } from './receitas'

/**
 * HU-22.1: cadastrar uma receita no mês que está na tela, de uma vez ou todo mês. HU-46.1: corrigir, encerrar a de todo
 * mês ou excluir.
 */
const props = defineProps<{ editando: Receita | null; /** yyyy-MM da tela. */ mes: string }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string] }>()

const REPETE = [
  { valor: 'UMA_VEZ', rotulo: 'Uma vez' },
  { valor: 'TODO_MES', rotulo: 'Todo mês' },
] as const

const descricao = ref('')
const valor = ref('')
const dia = ref('')
const repete = ref<'UMA_VEZ' | 'TODO_MES' | null>('UMA_VEZ')
const erros = useErrosDeCampos({ descricao, valor, data: dia, recorrente: repete })
const erro = ref('')
const enviando = ref(false)
const confirmando = ref<'excluir' | 'encerrar' | null>(null)

watch(aberta, (abriu) => {
  if (!abriu) return
  const e = props.editando
  descricao.value = e?.descricao ?? ''
  valor.value = e ? valorParaCampo(e.valor) : ''
  dia.value = e ? String(e.dia) : ''
  repete.value = e ? (e.recorrente ? 'TODO_MES' : 'UMA_VEZ') : 'UMA_VEZ'
  erros.value = {}
  erro.value = ''
  confirmando.value = null
})

/** O mês da data: o da receita, na edição; o da tela, na nova. */
const mesDaData = computed(() => props.editando?.primeiroMes ?? props.mes)
const nomeMes = computed(() => mesPorExtenso(mesDaData.value).split(' de ')[0])
const proximoMes = computed(() => mesPorExtenso(somarMeses(hojeIso().slice(0, 7), 1)).split(' de ')[0])

/** O dia no mês; dia 31 num mês de 30 vira o último. */
function data(): string | null {
  const n = Number(dia.value)
  if (!/^\d{1,2}$/.test(dia.value.trim()) || n < 1 || n > 31) return null
  const [ano, mes] = mesDaData.value.split('-').map(Number)
  const ultimo = new Date(ano, mes, 0).getDate()
  return `${mesDaData.value}-${String(Math.min(n, ultimo)).padStart(2, '0')}`
}

const resumo = computed(() => {
  const lido = lerValor(valor.value)
  const d = data()
  if (!descricao.value.trim() || !lido || !d) return ''
  const quando = repete.value === 'TODO_MES' ? `todo dia ${Number(dia.value)}, a partir de ${nomeMes.value}` : `em ${d.slice(8)}/${nomeMes.value.slice(0, 3)}`
  return `${descricao.value.trim()}: ${reais(lido)} ${quando}.`
})

function montar(): DadosReceita | null {
  const novos: Record<string, string> = {}
  if (!descricao.value.trim()) novos.descricao = 'Informe a descrição.'
  const lido = lerValor(valor.value)
  if (lido === null) novos.valor = 'Use um valor como 1.200,00.'
  else if (lido === 0) novos.valor = 'Informe um valor maior que zero.'
  const d = data()
  if (!d) novos.data = 'Use um dia entre 1 e 31.'
  if (!repete.value) novos.recorrente = 'Diga se repete.'
  erros.value = novos
  if (Object.keys(novos).length > 0) return null
  return { descricao: descricao.value.trim(), valor: lido!, data: d!, recorrente: repete.value === 'TODO_MES' }
}

async function executar(acao: () => Promise<string>) {
  if (enviando.value) return
  enviando.value = true
  erro.value = ''
  try {
    emit('salvo', await acao())
    aberta.value = false
  } catch (e) {
    if (e instanceof ErroApi && Object.keys(e.campos).length > 0) erros.value = e.campos
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
    confirmando.value = null
  }
}

function salvar() {
  const dados = montar()
  if (!dados) return
  const editando = props.editando
  executar(async () => {
    if (editando) {
      await alterarReceita(editando.id, dados)
      return 'Receita salva.'
    }
    const receita = await cadastrarReceita(dados)
    return `Receita cadastrada: ${receita.descricao}.`
  })
}

function pedirConfirmacao(acao: 'excluir' | 'encerrar') {
  const e = props.editando
  if (!e || enviando.value) return
  if (confirmando.value !== acao) {
    confirmando.value = acao
    return
  }
  executar(async () => {
    if (acao === 'encerrar') {
      await encerrarReceita(e.id)
      return `${e.descricao} encerrada. Ela não aparece mais a partir de ${proximoMes.value}.`
    }
    await excluirReceita(e.id)
    return `Receita excluída: ${e.descricao}.`
  })
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="editando ? 'Editar receita' : 'Nova receita'">
    <FormularioEmpilhado @enviar="salvar">
      <CampoTexto v-model="descricao" rotulo="Descrição" placeholder="Ex.: Salário" :maxlength="80" autocomplete="off" :erro="erros.descricao" />
      <LinhaCampos>
        <CampoTexto v-model="valor" rotulo="Valor (R$)" placeholder="0,00" decimal autocomplete="off" :erro="erros.valor" />
        <CampoTexto v-model="dia" :rotulo="`Data (dia de ${nomeMes.slice(0, 3)})`" placeholder="Ex.: 5" numerico :maxlength="2" autocomplete="off" :erro="erros.data" />
      </LinhaCampos>

      <ChipsEscolha v-if="!editando" v-model="repete" rotulo="Repete" :opcoes="REPETE" :erro="erros.recorrente" />
      <TextoAjuda v-else-if="editando.recorrente">
        Receita de todo mês: mudar o valor ou o dia vale deste mês em diante, nos meses ainda não confirmados.
      </TextoAjuda>

      <QuadroResumo v-if="resumo" rotulo="Resumo" :texto="resumo" destaque />
      <TextoAjuda v-if="!editando && repete === 'UMA_VEZ'">Se o dia já chegou, ela entra como recebida.</TextoAjuda>

      <CaixaAviso :mensagem="erro" />

      <TextoAjuda v-if="editando?.encerradaEm">Receita encerrada: não gera mais meses novos. O histórico fica guardado.</TextoAjuda>
      <BotaoAcao v-else tipo="submit" :carregando="enviando" texto-carregando="Salvando…">Salvar receita</BotaoAcao>
      <template v-if="editando">
        <BotaoAcao v-if="editando.recorrente && !editando.encerradaEm" variante="secundario" :desativado="enviando" @click="pedirConfirmacao('encerrar')">
          {{ confirmando === 'encerrar' ? 'Toque de novo para encerrar' : 'Encerrar receita' }}
        </BotaoAcao>
        <BotaoAcao variante="secundario" :desativado="enviando" @click="pedirConfirmacao('excluir')">
          {{ confirmando === 'excluir' ? 'Toque de novo para excluir' : 'Excluir receita' }}
        </BotaoAcao>
        <TextoAjuda v-if="editando.recorrente">
          Encerrar para de gerar a partir de {{ proximoMes }} e guarda o histórico. Excluir apaga todos os meses.
        </TextoAjuda>
      </template>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

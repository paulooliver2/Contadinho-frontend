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
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { diaMes, hojeIso, lerValor, mesPorExtenso, somarMeses, valorParaCampo } from '@/lib/formatos'
import { useCartoes } from '@/stores/cartoes'
import { useCategorias } from '@/stores/categorias'
import EssencialEscolha from './EssencialEscolha.vue'
import {
  alterarContaFixa,
  cadastrarContaFixa,
  encerrarContaFixa,
  FORMAS,
  type ContaDoMes,
  type DadosContaFixa,
  type FormaPagamento,
} from './gastos'

/**
 * HU-11: cadastrar ou editar uma conta fixa. Na edição, o valor novo vale do mês atual em diante (HU-11.3) e dá para
 * encerrar a conta (HU-11.4).
 */
const props = defineProps<{ editando: ContaDoMes | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string] }>()

const categorias = useCategorias()
const cartoes = useCartoes()

const descricao = ref('')
const valor = ref('')
const categoriaId = ref<string | null>(null)
const dia = ref('')
const forma = ref<FormaPagamento | null>('PIX_BOLETO')
const cartaoId = ref<string | null>(null)
/** Null segue a categoria (RN-28). */
const essencial = ref<boolean | null>(null)
const erros = useErrosDeCampos({ descricao, valor, categoriaId, diaVencimento: dia, formaPagamento: forma, cartaoId: [cartaoId, forma] })
const erro = ref('')
const enviando = ref(false)
const confirmandoEncerrar = ref(false)

const mesAtual = computed(() => mesPorExtenso(hojeIso().slice(0, 7)))
const proximoMes = computed(() => mesPorExtenso(somarMeses(hojeIso().slice(0, 7), 1)))

/** Como o servidor decide: se o vencimento deste mês já passou, a primeira conta é a do mês seguinte. */
const comecaNoProximo = computed(() => {
  const n = Number(dia.value)
  if (!Number.isInteger(n) || n < 1 || n > 31) return false
  const hoje = new Date()
  const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate()
  return Math.min(n, ultimo) < hoje.getDate()
})

watch(aberta, (abriu) => {
  if (!abriu) return
  const e = props.editando
  descricao.value = e?.conta.descricao ?? ''
  valor.value = e ? valorParaCampo(e.valorAtual) : ''
  categoriaId.value = e?.conta.categoriaId ?? null
  dia.value = e ? String(e.conta.diaVencimento) : ''
  forma.value = e?.conta.formaPagamento ?? 'PIX_BOLETO'
  cartaoId.value = e?.conta.cartaoId ?? null
  essencial.value = e?.conta.essencial ?? null
  erros.value = {}
  erro.value = ''
  confirmandoEncerrar.value = false
  if (!cartoes.carregado) cartoes.carregar().catch(() => {})
})

/** As ativas; na edição, a categoria atual entra mesmo se foi arquivada (RN-27). */
const opcoesCategorias = computed(() => {
  const lista = categorias.ativas.map((c) => ({ valor: c.id, rotulo: c.nome }))
  const atual = props.editando?.conta.categoriaId
  const arquivada = atual ? categorias.porId(atual) : undefined
  if (arquivada?.arquivada) lista.push({ valor: arquivada.id, rotulo: arquivada.nome })
  return lista
})

const opcoesCartoes = computed(() => cartoes.lista.map((c) => ({ valor: c.id, rotulo: c.apelido })))

/** As mesmas regras do servidor, para avisar antes de enviar. */
function montar(): DadosContaFixa | null {
  const novos: Record<string, string> = {}
  if (!descricao.value.trim()) novos.descricao = 'Informe a descrição.'
  const lido = lerValor(valor.value)
  if (lido === null) novos.valor = 'Use um valor como 120,50.'
  else if (lido === 0) novos.valor = 'Informe um valor maior que zero.'
  if (!categoriaId.value) novos.categoriaId = 'Escolha a categoria.'
  const numeroDia = Number(dia.value)
  if (!/^\d{1,2}$/.test(dia.value.trim()) || numeroDia < 1 || numeroDia > 31) novos.diaVencimento = 'Use um dia entre 1 e 31.'
  if (forma.value === 'CARTAO' && !cartaoId.value) novos.cartaoId = 'Escolha o cartão.'
  erros.value = novos
  if (Object.keys(novos).length > 0) return null
  return {
    descricao: descricao.value.trim(),
    valor: lido!,
    categoriaId: categoriaId.value!,
    diaVencimento: numeroDia,
    formaPagamento: forma.value!,
    cartaoId: forma.value === 'CARTAO' ? cartaoId.value! : undefined,
    essencial: essencial.value ?? undefined,
  }
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
    confirmandoEncerrar.value = false
  }
}

function salvar() {
  const dados = montar()
  if (!dados) return
  const editando = props.editando
  executar(async () => {
    if (!editando) {
      const conta = await cadastrarContaFixa(dados)
      return `Conta fixa cadastrada: ${conta.descricao}.${comecaNoProximo.value ? ` A primeira é a de ${proximoMes.value}.` : ''}`
    }
    await alterarContaFixa(editando.conta.id, dados)
    return 'Conta fixa salva.'
  })
}

function encerrar() {
  const e = props.editando
  if (!e || enviando.value) return
  if (!confirmandoEncerrar.value) {
    confirmandoEncerrar.value = true
    return
  }
  executar(async () => {
    await encerrarContaFixa(e.conta.id)
    return `${e.conta.descricao} encerrada. Ela não aparece mais a partir de ${proximoMes.value}.`
  })
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="editando ? 'Editar conta fixa' : 'Nova conta fixa'">
    <FormularioEmpilhado @enviar="salvar">
      <CampoTexto v-model="descricao" rotulo="Descrição" placeholder="Ex.: Aluguel" :maxlength="80" autocomplete="off" :erro="erros.descricao" />
      <LinhaCampos>
        <CampoTexto v-model="valor" rotulo="Valor (R$)" placeholder="0,00" decimal autocomplete="off" :erro="erros.valor" />
        <CampoTexto v-model="dia" rotulo="Vence todo dia" placeholder="Ex.: 10" numerico :maxlength="2" autocomplete="off" :erro="erros.diaVencimento" />
      </LinhaCampos>
      <TextoAjuda v-if="!editando && comecaNoProximo">
        O dia {{ dia }} deste mês já passou: a primeira conta é a de {{ proximoMes }}.
      </TextoAjuda>
      <TextoAjuda v-if="editando">
        Mudar o valor ou o dia vale de {{ mesAtual }} em diante; os meses anteriores ficam como estavam.
      </TextoAjuda>

      <ChipsEscolha v-model="categoriaId" rotulo="Categoria" :opcoes="opcoesCategorias" :erro="erros.categoriaId" />

      <ChipsEscolha v-model="forma" rotulo="Forma de pagamento" :opcoes="FORMAS" :erro="erros.formaPagamento" />
      <template v-if="forma === 'CARTAO'">
        <ChipsEscolha v-if="cartoes.lista.length > 0" v-model="cartaoId" rotulo="Qual cartão" :opcoes="opcoesCartoes" :erro="erros.cartaoId" />
        <TextoAjuda v-else>Nenhum cartão cadastrado. Cadastre o cartão na aba Cartões para escolher aqui.</TextoAjuda>
        <TextoAjuda>Ela aparece aqui e na fatura, mas só entra uma vez no total do mês.</TextoAjuda>
      </template>

      <EssencialEscolha v-model="essencial" :categoria-id="categoriaId" />

      <CaixaAviso :mensagem="erro" />

      <TextoAjuda v-if="editando?.conta.encerradaEm">
        Conta encerrada em {{ diaMes(editando.conta.encerradaEm) }}: não gera mais meses novos. O histórico fica guardado.
      </TextoAjuda>
      <BotaoAcao v-else tipo="submit" :carregando="enviando" texto-carregando="Salvando…">
        {{ editando ? 'Salvar' : 'Cadastrar conta' }}
      </BotaoAcao>
      <template v-if="editando && !editando.conta.encerradaEm">
        <BotaoAcao variante="secundario" :desativado="enviando" @click="encerrar">
          {{ confirmandoEncerrar ? 'Toque de novo para encerrar' : 'Encerrar conta' }}
        </BotaoAcao>
        <TextoAjuda>Encerrar para de gerar a conta a partir de {{ proximoMes }}. O histórico fica guardado.</TextoAjuda>
      </template>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

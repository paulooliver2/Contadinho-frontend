<script setup lang="ts">
import { ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import QuadroResumo from '@/components/QuadroResumo.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { lerDia } from '@/lib/formatos'
import { useCartoes, type Cartao } from '@/stores/cartoes'
import DiasCartao from './DiasCartao.vue'

/**
 * HU-45: apelido e dias do cartão. Sem histórico, ele pode ser excluído; com histórico, só encerrado, e as faturas
 * dele continuam nos totais e no A receber. Banco e final não mudam: o final identifica o cartão na importação.
 */
const props = defineProps<{ cartao: Cartao }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string]; removido: [mensagem: string] }>()

const cartoes = useCartoes()
const apelido = ref('')
const fechamento = ref('')
const vencimento = ref('')
const erros = useErrosDeCampos({ apelido, diaFechamento: fechamento, diaVencimento: vencimento })
const erro = ref('')
const enviando = ref(false)
/** Encerrar e excluir pedem um segundo toque. */
const confirmando = ref(false)

watch(aberta, (abriu) => {
  if (!abriu) return
  apelido.value = props.cartao.apelido
  fechamento.value = String(props.cartao.diaFechamento)
  vencimento.value = String(props.cartao.diaVencimento)
  erros.value = {}
  erro.value = ''
  confirmando.value = false
})

async function executar(acao: () => Promise<string>, aoTerminar: (mensagem: string) => void) {
  if (enviando.value) return
  enviando.value = true
  erro.value = ''
  try {
    const mensagem = await acao()
    aberta.value = false
    aoTerminar(mensagem)
  } catch (e) {
    if (e instanceof ErroApi && Object.keys(e.campos).length > 0) erros.value = e.campos
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
    confirmando.value = false
  }
}

function salvar() {
  const diaFechamento = lerDia(fechamento.value)
  const diaVencimento = lerDia(vencimento.value)
  const novos: Record<string, string> = {}
  if (diaFechamento === null) novos.diaFechamento = 'Use um dia entre 1 e 31.'
  if (diaVencimento === null) novos.diaVencimento = 'Use um dia entre 1 e 31.'
  erros.value = novos
  if (diaFechamento === null || diaVencimento === null) return
  executar(
    async () => {
      const salvo = await cartoes.alterar(props.cartao.id, {
        apelido: apelido.value.trim() || undefined,
        diaFechamento,
        diaVencimento,
      })
      return `${salvo.apelido} •• ${salvo.ultimos4} salvo.`
    },
    (m) => emit('salvo', m),
  )
}

function remover() {
  if (!confirmando.value) {
    confirmando.value = true
    return
  }
  const { id, podeExcluir } = props.cartao
  const nome = `${props.cartao.apelido} •• ${props.cartao.ultimos4}`
  executar(
    async () => {
      if (podeExcluir) {
        await cartoes.excluir(id)
        return `${nome} excluído.`
      }
      await cartoes.encerrar(id)
      return `${nome} encerrado. As faturas dele continuam no Início e no A receber.`
    },
    (m) => emit('removido', m),
  )
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" titulo="Editar cartão">
    <FormularioEmpilhado @enviar="salvar">
      <QuadroResumo rotulo="Cartão" :texto="`${cartao.bancoNome} · final ${cartao.ultimos4}`" />
      <CampoTexto v-model="apelido" rotulo="Apelido" :placeholder="cartao.bancoNome" :maxlength="40" :erro="erros.apelido" />
      <DiasCartao
        v-model:fechamento="fechamento"
        v-model:vencimento="vencimento"
        :erro-fechamento="erros.diaFechamento"
        :erro-vencimento="erros.diaVencimento"
      />
      <TextoAjuda>Os dias novos valem para as próximas faturas. As que já têm compras guardam as datas delas.</TextoAjuda>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :carregando="enviando && !confirmando" texto-carregando="Salvando…">Salvar</BotaoAcao>
      <BotaoAcao variante="secundario" :desativado="enviando" @click="remover">
        <template v-if="cartao.podeExcluir">{{ confirmando ? 'Toque de novo para excluir' : 'Excluir cartão' }}</template>
        <template v-else>{{ confirmando ? 'Toque de novo para encerrar' : 'Encerrar cartão' }}</template>
      </BotaoAcao>
      <TextoAjuda v-if="cartao.podeExcluir">O cartão ainda não tem faturas, contas nem gastos: dá para excluir de vez.</TextoAjuda>
      <TextoAjuda v-else>
        Com faturas, contas ou gastos, o cartão não se exclui. Encerrado, ele some daqui e das opções de pagamento, e o
        histórico continua no Início e no A receber.
      </TextoAjuda>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

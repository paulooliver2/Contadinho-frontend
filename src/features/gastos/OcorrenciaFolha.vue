<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import LinhaCampos from '@/components/LinhaCampos.vue'
import LinhaValor from '@/components/LinhaValor.vue'
import QuadroResumo from '@/components/QuadroResumo.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { diaMes, hojeIso, lerValor, mesPorExtenso, reais, valorParaCampo } from '@/lib/formatos'
import { desfazerPagamentoConta, FORMAS, pagarConta, type ContaDoMes } from './gastos'
import LigacaoFatura from './LigacaoFatura.vue'

/**
 * HU-13: a conta fixa num mês. Marca como paga (data e valor pagos, que podem diferir do previsto, RN-25) ou desfaz.
 * Conta no cartão é paga pela fatura e se liga à compra dela (HU-14). Daqui também se abre o cadastro da conta fixa
 * (HU-11.3).
 */
const props = defineProps<{ item: ContaDoMes | null; categoria: string; cartao?: string }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string]; editar: [] }>()

const valor = ref('')
const pagoEm = ref('')
const hoje = ref(hojeIso())
const erros = useErrosDeCampos({ valorPago: valor, pagoEm })
const erro = ref('')
const enviando = ref(false)

watch(aberta, (abriu) => {
  if (!abriu || !props.item) return
  hoje.value = hojeIso()
  valor.value = valorParaCampo(props.item.valorPrevisto)
  pagoEm.value = hoje.value
  erros.value = {}
  erro.value = ''
})

const mes = computed(() => (props.item ? mesPorExtenso(props.item.vencimento.slice(0, 7)).split(' de ')[0] : ''))

const situacao = computed(() => {
  const i = props.item
  if (!i) return ''
  return {
    A_PAGAR: 'a pagar',
    PAGA: 'paga',
    AGUARDANDO_FATURA: 'aguardando fatura',
    NA_FATURA: 'na fatura',
  }[i.status]
})

const cadastro = computed(() => {
  const i = props.item
  if (!i) return ''
  const forma =
    i.conta.formaPagamento === 'CARTAO' && props.cartao
      ? `Cartão ${props.cartao}`
      : FORMAS.find((f) => f.valor === i.conta.formaPagamento)?.rotulo
  return [`Todo dia ${i.conta.diaVencimento}`, forma, reais(i.valorAtual), props.categoria].join(' · ')
})

const noCartao = computed(() => props.item?.conta.formaPagamento === 'CARTAO')
const debitoAutomatico = computed(() => props.item?.conta.formaPagamento === 'DEBITO_AUTOMATICO')

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
  }
}

/** As mesmas regras do servidor, para avisar antes de enviar. */
function pagar() {
  const i = props.item
  if (!i) return
  const novos: Record<string, string> = {}
  const lido = lerValor(valor.value)
  if (lido === null) novos.valorPago = 'Use um valor como 120,50.'
  else if (lido === 0) novos.valorPago = 'Informe um valor maior que zero.'
  if (!pagoEm.value) novos.pagoEm = 'Informe a data.'
  else if (pagoEm.value > hoje.value) novos.pagoEm = 'A data não pode ser depois de hoje.'
  erros.value = novos
  if (Object.keys(novos).length > 0) return
  executar(async () => {
    const paga = await pagarConta(i.id, { pagoEm: pagoEm.value, valorPago: lido! })
    return `${i.conta.descricao} paga: ${reais(paga.valorPago ?? paga.valor)}.`
  })
}

/** HU-14: ligou ou desligou da fatura. */
function ligou(mensagem: string) {
  emit('salvo', mensagem)
  aberta.value = false
}

function desfazer() {
  const i = props.item
  if (!i) return
  executar(async () => {
    await desfazerPagamentoConta(i.id)
    return `Pagamento de ${i.conta.descricao} desfeito. Ela voltou para a pagar.`
  })
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="item ? `${item.conta.descricao} · ${mes}` : ''">
    <template v-if="item">
      <p class="subtitulo">Conta fixa · {{ situacao }}</p>

      <QuadroResumo class="cadastro" rotulo="Cadastro da conta fixa" :texto="cadastro" />

      <FormularioEmpilhado @enviar="pagar">
        <LigacaoFatura v-if="noCartao" :item="item" :cartao="cartao" @salvo="ligou" />

        <template v-else-if="item.status === 'PAGA'">
          <LinhaValor :rotulo="`Paga em ${diaMes(item.pagoEm!)}`" :valor="reais(item.valor)" />
          <TextoAjuda v-if="item.valorPago !== item.valorPrevisto">
            O previsto era {{ reais(item.valorPrevisto) }}; o total do mês usa o que foi pago.
          </TextoAjuda>
          <TextoAjuda v-if="debitoAutomatico">
            Débito automático é marcado como pago no dia do vencimento. Se o débito não aconteceu, desfaça.
          </TextoAjuda>
          <CaixaAviso :mensagem="erro" />
          <BotaoAcao variante="secundario" :carregando="enviando" texto-carregando="Desfazendo…" @click="desfazer">
            Desfazer pagamento
          </BotaoAcao>
        </template>

        <template v-else>
          <LinhaCampos>
            <CampoTexto v-model="valor" rotulo="Valor pago (R$)" placeholder="0,00" decimal autocomplete="off" :erro="erros.valorPago" />
            <CampoTexto v-model="pagoEm" rotulo="Pago em" tipo="date" :max="hoje" :erro="erros.pagoEm" />
          </LinhaCampos>
          <TextoAjuda>Vence em {{ diaMes(item.vencimento) }}. Se o valor veio diferente, o total do mês usa o que foi pago.</TextoAjuda>
          <CaixaAviso :mensagem="erro" />
          <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Salvando…">Marcar como paga</BotaoAcao>
        </template>

        <BotaoAcao variante="secundario" :desativado="enviando" @click="emit('editar')">Editar conta fixa</BotaoAcao>
      </FormularioEmpilhado>
    </template>
  </FolhaInferior>
</template>

<style scoped>
.subtitulo {
  margin: -8px 0 12px;
  font-size: 13px;
  color: var(--texto-suave);
}

.cadastro {
  margin-bottom: 16px;
}
</style>

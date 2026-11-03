<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import Interruptor from '@/components/Interruptor.vue'
import LinhaCampos from '@/components/LinhaCampos.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { hojeIso, lerValor, reais } from '@/lib/formatos'
import { useCarteira, type NovaMovimentacao, type PosicaoDetalhe } from '@/stores/carteira'
import { CASAS_PRECO, CASAS_QUANTIDADE, lerNumero, preco as formatarPreco, quantidade as formatarQuantidade } from './formatos'

/**
 * HU-30: aportar ou resgatar (RN-48). O aporte recalcula o preço médio; o resgate não. A renda fixa só resgata, por
 * valor, e "Resgatei tudo" encerra a aplicação.
 */
const props = defineProps<{ posicao: PosicaoDetalhe; tipo: 'APORTE' | 'RESGATE' }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [posicao: PosicaoDetalhe, mensagem: string] }>()

const loja = useCarteira()

const data = ref('')
const quantidade = ref('')
const preco = ref('')
const valor = ref('')
const total = ref(false)
const erros = useErrosDeCampos({ data, quantidade, preco, valor })
const erro = ref('')
const enviando = ref(false)

const rendaFixa = computed(() => props.posicao.tipo === 'RENDA_FIXA')
const tesouro = computed(() => props.posicao.tipo === 'TESOURO')
const aporte = computed(() => props.tipo === 'APORTE')
const inicial = computed(() => props.posicao.movimentacoes[0]?.data ?? hojeIso())

watch(aberta, (abriu) => {
  if (!abriu) return
  data.value = hojeIso()
  quantidade.value = ''
  preco.value = ''
  valor.value = ''
  total.value = false
  erros.value = {}
  erro.value = ''
}, { immediate: true })

const situacao = computed(() => {
  const p = props.posicao
  if (rendaFixa.value) return `Aplicado: ${reais(p.aplicado)}`
  const partes = [`Você tem ${formatarQuantidade(p, p.quantidade ?? 0)}`]
  if (p.precoMedio) partes.push(`preço médio ${formatarPreco(p.precoMedio)}`)
  return partes.join(', ') + '.'
})

const INFORME = 'Informe um valor maior que zero.'

function montar(): NovaMovimentacao | null {
  const novos: Record<string, string> = {}
  const pedido: NovaMovimentacao = { tipo: props.tipo, data: data.value || undefined }
  if (!data.value) novos.data = 'Informe a data.'
  if (rendaFixa.value) {
    const v = lerValor(valor.value)
    if (v === null || v <= 0) novos.valor = INFORME
    pedido.valor = v ?? undefined
    pedido.total = total.value
  } else {
    const casas = CASAS_QUANTIDADE[props.posicao.tipo]
    const q = lerNumero(quantidade.value, casas)
    if (q === null) novos.quantidade = casas === 0 && lerNumero(quantidade.value, 8) !== null ? 'Use um número inteiro.' : INFORME
    pedido.quantidade = q ?? undefined
    if (aporte.value && tesouro.value) {
      const v = lerValor(valor.value)
      if (v === null || v <= 0) novos.valor = INFORME
      pedido.valor = v ?? undefined
    } else if (aporte.value) {
      const p = lerNumero(preco.value, CASAS_PRECO)
      if (p === null) novos.preco = INFORME
      pedido.preco = p ?? undefined
    }
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
    const atualizada = await loja.movimentar(props.posicao.id, pedido)
    const mensagem = atualizada.encerrada ? 'Resgate registrado. A posição foi para as encerradas.'
      : aporte.value ? 'Aporte registrado.' : 'Resgate registrado.'
    emit('salvo', atualizada, mensagem)
    aberta.value = false
  } catch (e) {
    if (e instanceof ErroApi && Object.keys(e.campos).length > 0) {
      // Erros que não são de um campo da folha (o tipo, na renda fixa) aparecem embaixo.
      const conhecidos = ['data', 'quantidade', 'preco', 'valor']
      const soltos = Object.entries(e.campos).filter(([campo]) => !conhecidos.includes(campo))
      erros.value = e.campos
      erro.value = soltos.map(([, m]) => m).join(' ')
    } else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="aporte ? 'Aportar' : 'Resgatar'">
    <FormularioEmpilhado @enviar="salvar">
      <TextoAjuda>{{ situacao }}</TextoAjuda>

      <template v-if="rendaFixa">
        <CampoTexto v-model="valor" rotulo="Valor resgatado (R$)" decimal placeholder="3.000,00" :erro="erros.valor" />
        <Interruptor v-model="total" rotulo="Resgatei tudo" descricao="Encerra a aplicação. O valor pode passar do aplicado, com o rendimento." />
      </template>
      <template v-else>
        <LinhaCampos v-if="aporte">
          <CampoTexto v-model="quantidade" rotulo="Quantidade" :numerico="posicao.tipo === 'ACAO'" :decimal="posicao.tipo !== 'ACAO'" :erro="erros.quantidade" />
          <CampoTexto v-if="tesouro" v-model="valor" rotulo="Valor (R$)" decimal :erro="erros.valor" />
          <CampoTexto v-else v-model="preco" rotulo="Preço (R$)" decimal :erro="erros.preco" />
        </LinhaCampos>
        <CampoTexto v-else v-model="quantidade" rotulo="Quantidade" :numerico="posicao.tipo === 'ACAO'" :decimal="posicao.tipo !== 'ACAO'" :erro="erros.quantidade" />
        <TextoAjuda v-if="!aporte">O resgate não muda o preço médio.</TextoAjuda>
      </template>

      <CampoTexto v-model="data" rotulo="Data" tipo="date" :max="hojeIso()" :erro="erros.data" />
      <TextoAjuda v-if="data && data < inicial" tom="aviso">A data não pode ser antes da posição inicial.</TextoAjuda>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Salvando…">
        {{ aporte ? 'Registrar aporte' : 'Registrar resgate' }}
      </BotaoAcao>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

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
import { lerDia } from '@/lib/formatos'
import { useCartoes, type Banco, type Cartao } from '@/stores/cartoes'
import DiasCartao from './DiasCartao.vue'

const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ cadastrado: [cartao: Cartao] }>()

const cartoes = useCartoes()

type CodigoBanco = Banco['codigo']
const banco = ref<CodigoBanco | null>(null)
const apelido = ref('')
const ultimos4 = ref('')
const fechamento = ref('')
const vencimento = ref('')
const erros = useErrosDeCampos({ banco, apelido, ultimos4, diaFechamento: fechamento, diaVencimento: vencimento })
const erro = ref('')
const enviando = ref(false)

// Cada abertura começa do zero.
watch(aberta, (abriu) => {
  if (!abriu) return
  banco.value = null
  apelido.value = ultimos4.value = fechamento.value = vencimento.value = ''
  erros.value = {}
  erro.value = ''
})

const opcoesBanco = computed(() => cartoes.bancos.map((b) => ({ valor: b.codigo, rotulo: b.nome })))

/** RN-13: o que esperar da importação desse banco. */
const notaModelo = computed(() => {
  const modelo = cartoes.bancos.find((b) => b.codigo === banco.value)?.modelo
  if (modelo === 'SEM_MODELO') return { tom: 'info', texto: 'Sem modelo pronto: na primeira importação você indica as colunas do CSV.' } as const
  if (modelo === 'BETA') return { tom: 'aviso', texto: 'Modelo de importação em beta: confira os valores na primeira importação.' } as const
  if (modelo === 'VERIFICADO') return { tom: 'sucesso', texto: 'Modelo de importação verificado.' } as const
  return null
})

/** As mesmas regras do servidor (RN-07, RN-08), para avisar antes de enviar. */
function conferir(): boolean {
  const novos: Record<string, string> = {}
  if (!banco.value) novos.banco = 'Escolha o banco.'
  if (!/^\d{4}$/.test(ultimos4.value)) novos.ultimos4 = 'Informe os 4 últimos dígitos.'
  if (lerDia(fechamento.value) === null) novos.diaFechamento = 'Use um dia entre 1 e 31.'
  if (lerDia(vencimento.value) === null) novos.diaVencimento = 'Use um dia entre 1 e 31.'
  erros.value = novos
  return Object.keys(novos).length === 0
}

async function salvar() {
  if (enviando.value) return
  erro.value = ''
  if (!conferir()) return
  enviando.value = true
  try {
    const cartao = await cartoes.cadastrar({
      banco: banco.value!,
      apelido: apelido.value.trim() || undefined,
      ultimos4: ultimos4.value,
      diaFechamento: lerDia(fechamento.value)!,
      diaVencimento: lerDia(vencimento.value)!,
    })
    emit('cadastrado', cartao)
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
  <FolhaInferior v-model:aberta="aberta" titulo="Novo cartão">
    <FormularioEmpilhado @enviar="salvar">
      <ChipsEscolha v-model="banco" rotulo="Banco" :opcoes="opcoesBanco" :erro="erros.banco">
        <TextoAjuda v-if="notaModelo" :tom="notaModelo.tom">{{ notaModelo.texto }}</TextoAjuda>
      </ChipsEscolha>

      <LinhaCampos colunas="1.5fr 1fr">
        <CampoTexto v-model="apelido" rotulo="Apelido" placeholder="Ex.: Itaú da casa" :maxlength="40" :erro="erros.apelido" />
        <CampoTexto v-model="ultimos4" rotulo="Final" placeholder="0000" numerico :maxlength="4" autocomplete="off" :erro="erros.ultimos4" />
      </LinhaCampos>

      <DiasCartao
        v-model:fechamento="fechamento"
        v-model:vencimento="vencimento"
        :erro-fechamento="erros.diaFechamento"
        :erro-vencimento="erros.diaVencimento"
      />

      <TextoAjuda>O app nunca pede o número completo do cartão nem o código de segurança.</TextoAjuda>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Salvando…">Salvar cartão</BotaoAcao>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

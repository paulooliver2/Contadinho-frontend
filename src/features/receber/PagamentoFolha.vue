<script setup lang="ts">
import { ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import LinhaCampos from '@/components/LinhaCampos.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { hojeIso, lerValor, reais, valorParaCampo } from '@/lib/formatos'
import { registrarPagamento } from './receber'

/** HU-19.1: o valor vem com o saldo inteiro e pode virar um pagamento parcial. */
const props = defineProps<{ pessoaId: string; nome: string; saldo: number }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string] }>()

const valor = ref('')
const recebidoEm = ref('')
const erros = useErrosDeCampos({ valor, recebidoEm })
const erro = ref('')
const enviando = ref(false)
const hoje = ref(hojeIso())

watch(aberta, (abriu) => {
  if (!abriu) return
  hoje.value = hojeIso()
  valor.value = valorParaCampo(props.saldo)
  recebidoEm.value = hoje.value
  erros.value = {}
  erro.value = ''
})

/** As mesmas regras do servidor (HU-19.4), para avisar antes de enviar. */
function montar(): number | null {
  const novos: Record<string, string> = {}
  const lido = lerValor(valor.value)
  if (lido === null) novos.valor = 'Use um valor como 120,50.'
  else if (lido === 0) novos.valor = 'Informe um valor maior que zero.'
  else if (lido > props.saldo) novos.valor = 'Valor maior que o devido.'
  if (!recebidoEm.value) novos.recebidoEm = 'Informe a data.'
  else if (recebidoEm.value > hoje.value) novos.recebidoEm = 'A data não pode ser depois de hoje.'
  erros.value = novos
  return Object.keys(novos).length > 0 ? null : lido
}

async function salvar() {
  const lido = montar()
  if (lido === null || enviando.value) return
  enviando.value = true
  erro.value = ''
  try {
    await registrarPagamento(props.pessoaId, lido, recebidoEm.value)
    emit('salvo', lido === props.saldo ? `${props.nome} quitou o saldo.` : `Pagamento de ${reais(lido)} registrado.`)
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
  <FolhaInferior v-model:aberta="aberta" titulo="Marcar como pago">
    <FormularioEmpilhado @enviar="salvar">
      <LinhaCampos>
        <CampoTexto v-model="valor" rotulo="Valor recebido (R$)" placeholder="0,00" decimal autocomplete="off" :erro="erros.valor" />
        <CampoTexto v-model="recebidoEm" rotulo="Recebido em" tipo="date" :max="hoje" :erro="erros.recebidoEm" />
      </LinhaCampos>

      <TextoAjuda>
        {{ nome }} deve {{ reais(saldo) }}. Para um pagamento parcial, troque o valor: ele abate primeiro o que vence antes.
      </TextoAjuda>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Registrando…">Registrar pagamento</BotaoAcao>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

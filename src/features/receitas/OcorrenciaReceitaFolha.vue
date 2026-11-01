<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import LinhaValor from '@/components/LinhaValor.vue'
import QuadroResumo from '@/components/QuadroResumo.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { diaMes, lerValor, mesPorExtenso, reais, valorParaCampo } from '@/lib/formatos'
import { confirmarReceita, desfazerConfirmacao, type ReceitaDoMes } from './receitas'

/** HU-22.2: a receita num mês. Confirma que caiu, talvez com outro valor, ou desfaz. Daqui se edita o cadastro. */
const props = defineProps<{ item: ReceitaDoMes | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string]; editar: [] }>()

const valor = ref('')
const erros = useErrosDeCampos({ valorRecebido: valor })
const erro = ref('')
const enviando = ref(false)

watch(aberta, (abriu) => {
  if (!abriu || !props.item) return
  valor.value = valorParaCampo(props.item.valorPrevisto)
  erros.value = {}
  erro.value = ''
})

const mes = computed(() => (props.item ? mesPorExtenso(props.item.data.slice(0, 7)).split(' de ')[0] : ''))

const situacao = computed(
  () => ({ PREVISTA: 'prevista', A_CONFIRMAR: 'caiu? confirme', RECEBIDA: 'recebida' })[props.item?.status ?? 'PREVISTA'],
)

const cadastro = computed(() => {
  const r = props.item?.receita
  if (!r) return ''
  return [r.recorrente ? `Todo dia ${r.dia}` : 'Uma vez', reais(r.valor)].join(' · ')
})

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

function confirmar() {
  const i = props.item
  if (!i) return
  const lido = lerValor(valor.value)
  if (lido === null) erros.value = { valorRecebido: 'Use um valor como 7.800,00.' }
  else if (lido === 0) erros.value = { valorRecebido: 'Informe um valor maior que zero.' }
  else erros.value = {}
  if (Object.keys(erros.value).length > 0) return
  executar(async () => {
    const r = await confirmarReceita(i.id, lido!)
    return `${i.receita.descricao} recebida: ${reais(r.valor)}.`
  })
}

function desfazer() {
  const i = props.item
  if (!i) return
  executar(async () => {
    await desfazerConfirmacao(i.id)
    return `Recebimento de ${i.receita.descricao} desfeito.`
  })
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="item ? `${item.receita.descricao} · ${mes}` : ''">
    <template v-if="item">
      <p class="subtitulo">Receita · {{ situacao }}</p>
      <QuadroResumo class="cadastro" rotulo="Cadastro da receita" :texto="cadastro" />

      <FormularioEmpilhado @enviar="confirmar">
        <template v-if="item.status === 'RECEBIDA'">
          <LinhaValor :rotulo="`Recebida em ${diaMes(item.data)}`" :valor="reais(item.valor)" />
          <TextoAjuda v-if="item.valorRecebido !== item.valorPrevisto">
            O previsto era {{ reais(item.valorPrevisto) }}; o total do mês usa o que caiu.
          </TextoAjuda>
          <CaixaAviso :mensagem="erro" />
          <BotaoAcao variante="secundario" :carregando="enviando" texto-carregando="Desfazendo…" @click="desfazer">
            Não caiu, desfazer
          </BotaoAcao>
        </template>

        <template v-else>
          <CampoTexto v-model="valor" rotulo="Valor que caiu (R$)" placeholder="0,00" decimal autocomplete="off" :erro="erros.valorRecebido" />
          <TextoAjuda>Cai em {{ diaMes(item.data) }}. Se caiu outro valor, ajuste antes de confirmar.</TextoAjuda>
          <CaixaAviso :mensagem="erro" />
          <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Salvando…">Confirmar recebimento</BotaoAcao>
        </template>

        <BotaoAcao variante="secundario" :desativado="enviando" @click="emit('editar')">Editar receita</BotaoAcao>
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

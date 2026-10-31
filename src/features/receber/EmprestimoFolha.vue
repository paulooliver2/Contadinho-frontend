<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { diaMesCurto, hojeIso, lerValor, reais, somarMesesData } from '@/lib/formatos'
import { usePessoas } from '@/stores/pessoas'
import { dividirEmParcelas, registrarEmprestimo } from './receber'

/**
 * HU-17: registrar dinheiro emprestado fora do cartão. Escolhe a pessoa (ou cadastra uma na hora), o valor, as
 * parcelas e a primeira devolução, ou "Sem data" (RN-32). Compra no cartão não se registra aqui: vai pela fatura.
 */
const props = defineProps<{ pessoaId?: string }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string] }>()

const pessoas = usePessoas()

const TIPOS = [
  { valor: 'PIX', rotulo: 'Dinheiro (Pix)' },
  { valor: 'CARTAO', rotulo: 'Compra no cartão' },
] as const
const PARCELAS = [
  { valor: '1', rotulo: 'À vista' },
  { valor: '2', rotulo: '2x' },
  { valor: '3', rotulo: '3x' },
  { valor: '6', rotulo: '6x' },
] as const
const PRAZOS = [
  { valor: 'DATA', rotulo: 'Com data' },
  { valor: 'SEM_DATA', rotulo: 'Sem data' },
] as const
/** A pessoa ainda não cadastrada; na escolha ela é este valor. */
const NOVA = 'NOVA'

const tipo = ref<(typeof TIPOS)[number]['valor'] | null>('PIX')
const pessoaId = ref<string | null>(null)
const nomeNova = ref('')
const valor = ref('')
const parcelas = ref<(typeof PARCELAS)[number]['valor'] | null>('1')
const descricao = ref('')
const prazo = ref<(typeof PRAZOS)[number]['valor'] | null>('DATA')
const primeiraDevolucao = ref('')
const erros = useErrosDeCampos({ pessoaId: [pessoaId, nomeNova], valor: [valor, parcelas], parcelas, descricao, primeiraDevolucao: [primeiraDevolucao, prazo] })
const erro = ref('')
const enviando = ref(false)

watch(aberta, (abriu) => {
  if (!abriu) return
  tipo.value = 'PIX'
  pessoaId.value = props.pessoaId ?? null
  nomeNova.value = ''
  valor.value = ''
  parcelas.value = '1'
  descricao.value = ''
  prazo.value = 'DATA'
  primeiraDevolucao.value = somarMesesData(hojeIso(), 1)
  erros.value = {}
  erro.value = ''
})

const opcoesPessoas = computed(() => [
  ...pessoas.ativas.map((p) => ({ valor: p.id, rotulo: p.apelido ?? p.nome })),
  { valor: NOVA, rotulo: '+ Nova pessoa' },
])

const nomeEscolhido = computed(() => {
  if (pessoaId.value === NOVA) return nomeNova.value.trim().split(' ')[0] || 'A pessoa'
  return pessoaId.value ? pessoas.rotulo(pessoaId.value) : 'A pessoa'
})

/** HU-17.4: "Lucas te devolve 3x de R$ 200,00, a primeira em 10/nov." */
const resumo = computed(() => {
  const lido = lerValor(valor.value)
  const n = Number(parcelas.value)
  if (!lido || !n) return ''
  const { cada, ultima } = dividirEmParcelas(lido, n)
  if (cada <= 0) return ''
  let quanto = n === 1 ? reais(lido) : `${n}x de ${reais(cada)}`
  if (n > 1 && ultima !== cada) quanto += ` (a última de ${reais(ultima)})`
  const quando = prazo.value === 'SEM_DATA' || !primeiraDevolucao.value
    ? ', sem data combinada'
    : `${n === 1 ? ' em' : ', a primeira em'} ${diaMesCurto(primeiraDevolucao.value)}`
  return `${nomeEscolhido.value} te devolve ${quanto}${quando}.`
})

/** As mesmas regras do servidor, para avisar antes de enviar. */
function montar(): number | null {
  const novos: Record<string, string> = {}
  if (!pessoaId.value) novos.pessoaId = 'Escolha a pessoa.'
  else if (pessoaId.value === NOVA && !nomeNova.value.trim()) novos.pessoaId = 'Informe o nome da nova pessoa.'
  const lido = lerValor(valor.value)
  if (lido === null) novos.valor = 'Use um valor como 120,50.'
  else if (lido === 0) novos.valor = 'Informe um valor maior que zero.'
  else if (dividirEmParcelas(lido, Number(parcelas.value)).cada <= 0) novos.valor = 'Valor pequeno demais para tantas parcelas.'
  if (prazo.value === 'DATA' && !primeiraDevolucao.value) novos.primeiraDevolucao = 'Informe a data ou escolha "Sem data".'
  erros.value = novos
  return Object.keys(novos).length > 0 ? null : lido
}

async function salvar() {
  const lido = montar()
  if (lido === null || enviando.value) return
  enviando.value = true
  erro.value = ''
  try {
    // A pessoa nova fica cadastrada mesmo se o empréstimo falhar; ao tentar de novo, ela já vem escolhida.
    if (pessoaId.value === NOVA) {
      pessoaId.value = (await pessoas.cadastrar({ nome: nomeNova.value.trim(), apelido: '', whatsapp: '' })).id
    }
    const texto = resumo.value
    await registrarEmprestimo({
      pessoaId: pessoaId.value!,
      descricao: descricao.value.trim(),
      valor: lido,
      parcelas: Number(parcelas.value),
      primeiraDevolucao: prazo.value === 'DATA' ? primeiraDevolucao.value : undefined,
    })
    emit('salvo', `Empréstimo registrado. ${texto}`)
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
  <FolhaInferior v-model:aberta="aberta" titulo="Registrar valor emprestado">
    <FormularioEmpilhado @enviar="salvar">
      <ChipsEscolha v-model="tipo" rotulo="O que foi" :opcoes="TIPOS" />

      <template v-if="tipo === 'CARTAO'">
        <TextoAjuda>
          Compra no cartão chega pela fatura. Abra a fatura do cartão e toque no responsável da compra: o valor entra
          aqui sozinho.
        </TextoAjuda>
        <BotaoAcao para="/cartoes">Ir para a fatura</BotaoAcao>
      </template>

      <template v-else>
        <ChipsEscolha v-model="pessoaId" rotulo="Quem pegou" :opcoes="opcoesPessoas" :erro="erros.pessoaId">
          <CampoTexto v-if="pessoaId === NOVA" v-model="nomeNova" rotulo="Nome da nova pessoa" placeholder="Ex.: Lucas Andrade" :maxlength="80" autocomplete="off" />
        </ChipsEscolha>

        <CampoTexto v-model="valor" rotulo="Valor (R$)" placeholder="0,00" decimal autocomplete="off" :erro="erros.valor" />
        <CampoTexto v-model="descricao" rotulo="Para quê (opcional)" placeholder="Ex.: conserto do carro" :maxlength="80" autocomplete="off" :erro="erros.descricao" />
        <ChipsEscolha v-model="parcelas" rotulo="Devolve em" :opcoes="PARCELAS" :erro="erros.parcelas" />

        <ChipsEscolha v-model="prazo" rotulo="Primeira devolução" :opcoes="PRAZOS" :erro="erros.primeiraDevolucao">
          <CampoTexto v-if="prazo === 'DATA'" v-model="primeiraDevolucao" rotulo="Data da primeira devolução" tipo="date" />
        </ChipsEscolha>
        <TextoAjuda v-if="prazo === 'SEM_DATA'">Sem data, não entra na ordem por vencimento nem gera aviso.</TextoAjuda>

        <p v-if="resumo" class="resumo" role="status">{{ resumo }}</p>

        <CaixaAviso :mensagem="erro" />

        <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Registrando…">Registrar</BotaoAcao>
      </template>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

<style scoped>
.resumo {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--raio-campo);
  background: var(--marca-clara);
  color: var(--marca-escura);
  font-size: 14px;
  font-weight: 600;
}
</style>

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
import { hojeIso, lerValor, reais, valorParaCampo } from '@/lib/formatos'
import { useCartoes } from '@/stores/cartoes'
import { useCategorias } from '@/stores/categorias'
import EssencialEscolha from './EssencialEscolha.vue'
import { alterarGasto, excluirGasto, registrarGasto, type DadosGasto, type Gasto } from './gastos'

/**
 * HU-12: registrar um gasto avulso; HU-46: corrigir ou excluir. No cartão, avisa que o gasto vem pela fatura e não
 * soma no total do mês (RN-26).
 */
const props = defineProps<{ editando: Gasto | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string] }>()

const categorias = useCategorias()
const cartoes = useCartoes()

const descricao = ref('')
const valor = ref('')
const data = ref('')
const hoje = ref(hojeIso())
const categoriaId = ref<string | null>(null)
/** "PIX_BOLETO", "DEBITO" ou o id do cartão. */
const pagoCom = ref<string | null>('PIX_BOLETO')
const essencial = ref<boolean | null>(null)
const erros = useErrosDeCampos({ descricao, valor, data, categoriaId, formaPagamento: pagoCom, cartaoId: pagoCom })
const erro = ref('')
const enviando = ref(false)
const confirmandoExcluir = ref(false)

watch(aberta, (abriu) => {
  if (!abriu) return
  const e = props.editando
  hoje.value = hojeIso()
  descricao.value = e?.descricao ?? ''
  valor.value = e ? valorParaCampo(e.valor) : ''
  data.value = e?.data ?? hoje.value
  categoriaId.value = e?.categoriaId ?? null
  pagoCom.value = e ? (e.formaPagamento === 'CARTAO' ? e.cartaoId! : e.formaPagamento) : 'PIX_BOLETO'
  essencial.value = e?.essencial ?? null
  erros.value = {}
  erro.value = ''
  confirmandoExcluir.value = false
  if (!cartoes.carregado) cartoes.carregar().catch(() => {})
})

/** As ativas; na edição, a categoria atual entra mesmo se foi arquivada (RN-27). */
const opcoesCategorias = computed(() => {
  const lista = categorias.ativas.map((c) => ({ valor: c.id, rotulo: c.nome }))
  const atual = props.editando?.categoriaId
  const arquivada = atual ? categorias.porId(atual) : undefined
  if (arquivada?.arquivada) lista.push({ valor: arquivada.id, rotulo: arquivada.nome })
  return lista
})

const opcoesPagamento = computed(() => [
  { valor: 'PIX_BOLETO', rotulo: 'Pix / boleto' },
  { valor: 'DEBITO', rotulo: 'Débito' },
  ...cartoes.lista.map((c) => ({ valor: c.id, rotulo: `Cartão ${c.apelido}` })),
])

const noCartao = computed(() => pagoCom.value !== null && pagoCom.value !== 'PIX_BOLETO' && pagoCom.value !== 'DEBITO')

/** As mesmas regras do servidor, para avisar antes de enviar. */
function montar(): DadosGasto | null {
  const novos: Record<string, string> = {}
  if (!descricao.value.trim()) novos.descricao = 'Informe a descrição.'
  const lido = lerValor(valor.value)
  if (lido === null) novos.valor = 'Use um valor como 86,50.'
  else if (lido === 0) novos.valor = 'Informe um valor maior que zero.'
  if (!data.value) novos.data = 'Informe a data.'
  else if (data.value > hoje.value) novos.data = 'A data não pode ser depois de hoje.'
  if (!categoriaId.value) novos.categoriaId = 'Escolha a categoria.'
  if (!pagoCom.value) novos.formaPagamento = 'Escolha como pagou.'
  erros.value = novos
  if (Object.keys(novos).length > 0) return null
  return {
    descricao: descricao.value.trim(),
    valor: lido!,
    data: data.value,
    categoriaId: categoriaId.value!,
    formaPagamento: noCartao.value ? 'CARTAO' : (pagoCom.value as 'PIX_BOLETO' | 'DEBITO'),
    cartaoId: noCartao.value ? pagoCom.value! : undefined,
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
    confirmandoExcluir.value = false
  }
}

function salvar() {
  const dados = montar()
  if (!dados) return
  const editando = props.editando
  executar(async () => {
    const salvo = editando ? await alterarGasto(editando.id, dados) : await registrarGasto(dados)
    const texto = `${editando ? 'Gasto salvo' : 'Gasto registrado'}: ${salvo.descricao}, ${reais(salvo.valor)}.`
    if (salvo.status === 'NA_FATURA') return `${texto} Ele já está na fatura.`
    if (salvo.status === 'AGUARDANDO_FATURA') return `${texto} Aguardando a fatura.`
    return texto
  })
}

function excluir() {
  const e = props.editando
  if (!e || enviando.value) return
  if (!confirmandoExcluir.value) {
    confirmandoExcluir.value = true
    return
  }
  executar(async () => {
    await excluirGasto(e.id)
    return `Gasto excluído: ${e.descricao}.`
  })
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="editando ? 'Editar gasto' : 'Novo gasto'">
    <FormularioEmpilhado @enviar="salvar">
      <CampoTexto v-model="descricao" rotulo="Descrição" placeholder="Ex.: Feira" :maxlength="80" autocomplete="off" :erro="erros.descricao" />
      <LinhaCampos>
        <CampoTexto v-model="valor" rotulo="Valor (R$)" placeholder="0,00" decimal autocomplete="off" :erro="erros.valor" />
        <CampoTexto v-model="data" rotulo="Data" tipo="date" :max="hoje" :erro="erros.data" />
      </LinhaCampos>

      <ChipsEscolha v-model="categoriaId" rotulo="Categoria" :opcoes="opcoesCategorias" :erro="erros.categoriaId" />

      <ChipsEscolha v-model="pagoCom" rotulo="Pago com" :opcoes="opcoesPagamento" :erro="erros.formaPagamento ?? erros.cartaoId" />
      <TextoAjuda v-if="noCartao">
        Compra no cartão vem pela fatura: ao importar, ela já aparece lá, e não precisa registrar aqui. Se registrar, o
        gasto fica aguardando a fatura e não soma de novo no total do mês.
      </TextoAjuda>

      <EssencialEscolha v-model="essencial" :categoria-id="categoriaId" />

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Salvando…">
        {{ editando ? 'Salvar' : 'Registrar gasto' }}
      </BotaoAcao>
      <template v-if="editando">
        <BotaoAcao variante="secundario" :desativado="enviando" @click="excluir">
          {{ confirmandoExcluir ? 'Toque de novo para excluir' : 'Excluir gasto' }}
        </BotaoAcao>
        <TextoAjuda v-if="editando.status === 'NA_FATURA'">Excluir não mexe na compra da fatura.</TextoAjuda>
      </template>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

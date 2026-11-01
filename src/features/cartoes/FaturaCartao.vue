<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CartaoResumo from '@/components/CartaoResumo.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import IconeCartao from '@/components/IconeCartao.vue'
import NavegadorMes from '@/components/NavegadorMes.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { diaMes, reais } from '@/lib/formatos'
import { useAvisos } from '@/stores/avisos'
import type { Cartao } from '@/stores/cartoes'
import { usePessoas } from '@/stores/pessoas'
import CompraFolha from './CompraFolha.vue'
import DivisaoFatura from './DivisaoFatura.vue'
import { buscarFatura, type Fatura, type Importacao, type Lancamento } from './faturas'
import ImportarFolha from './ImportarFolha.vue'
import LinhaLancamento from './LinhaLancamento.vue'
import ResponsavelFolha from './ResponsavelFolha.vue'

/**
 * A fatura do cartão, mês a mês, começando pela aberta (RN-58). As duas formas de registrar:
 * importar o arquivo do banco (HU-06) ou digitar compra por compra (HU-47). Cada compra mostra de quem é (HU-08),
 * e o total vem dividido por responsável, com filtro (HU-10).
 */
/** `mesInicial`: a fatura a abrir, como a que o Início mostra; sem ele, a aberta. */
const props = defineProps<{ cartao: Cartao; mesInicial?: string }>()

const mes = ref(props.mesInicial ?? props.cartao.faturaAberta)
const avisos = useAvisos()
const fatura = ref<Fatura | null>(null)
const carregando = ref(false)
const erroCarga = ref('')
const aviso = ref('')
const folhaAberta = ref(false)
const editando = ref<Lancamento | null>(null)
const seletorArquivo = ref<HTMLInputElement>()
const arquivo = ref<File | null>(null)
const importarAberta = ref(false)
const responsavelAberta = ref(false)
const atribuindo = ref<Lancamento | null>(null)
/** HU-10: id da pessoa, DONO para as compras sem responsável, ou null para todas. */
const filtro = ref<string | null>(null)

/** A divisão só aparece quando alguém além do dono tem compras na fatura. */
const dividida = computed(() => fatura.value?.partes.some((p) => p.pessoaId) ?? false)

const lancamentosVisiveis = computed(() => {
  const todos = fatura.value?.lancamentos ?? []
  if (!filtro.value) return todos
  return todos.filter((l) => (l.pessoaId ?? 'DONO') === filtro.value)
})

const nomeDoFiltro = computed(() => (filtro.value === 'DONO' ? 'você' : filtro.value ? pessoas.rotulo(filtro.value) : ''))

// Os nomes dos responsáveis e as opções de escolha vêm das pessoas cadastradas.
const pessoas = usePessoas()
if (!pessoas.carregado) {
  pessoas.carregar().catch((e) => {
    erroCarga.value = mensagemDeErro(e)
  })
}

function responsavel(l: Lancamento): string {
  return l.pessoaId ? pessoas.rotulo(l.pessoaId) : 'Você'
}

function trocarResponsavel(l: Lancamento) {
  atribuindo.value = l
  responsavelAberta.value = true
}

async function carregar() {
  const pedido = mes.value
  carregando.value = true
  erroCarga.value = ''
  try {
    const lida = await buscarFatura(props.cartao.id, pedido)
    // Tocar rápido nas setas dispara várias buscas; só a do mês atual vale.
    if (pedido === mes.value) fatura.value = lida
  } catch (e) {
    if (pedido === mes.value) erroCarga.value = mensagemDeErro(e)
  } finally {
    if (pedido === mes.value) carregando.value = false
  }
}

// Trocar de mês limpa o aviso, exceto o da importação, que leva a tela para a fatura importada.
let avisoAoTrocar = ''
watch(mes, () => {
  filtro.value = null
  aviso.value = avisoAoTrocar
  avisoAoTrocar = ''
  carregar()
}, { immediate: true })

function novaCompra() {
  editando.value = null
  folhaAberta.value = true
}

function corrigir(lancamento: Lancamento) {
  editando.value = lancamento
  folhaAberta.value = true
}

function escolheuArquivo(evento: Event) {
  const campo = evento.target as HTMLInputElement
  arquivo.value = campo.files?.[0] ?? null
  // Limpa para que escolher o mesmo arquivo de novo também dispare o evento.
  campo.value = ''
  if (arquivo.value) importarAberta.value = true
}

/** HU-07: "X novos, Y já existiam". A tela vai para a fatura que recebeu as compras. */
function aoImportar(r: Importacao) {
  const partes = [`${r.novos} ${r.novos === 1 ? 'nova' : 'novas'}`]
  if (r.casadas > 0) partes.push(`${r.casadas} ${r.casadas === 1 ? 'digitada confirmada' : 'digitadas confirmadas'}`)
  partes.push(`${r.jaExistiam} já ${r.jaExistiam === 1 ? 'existia' : 'existiam'}`)
  const mensagem = `Fatura importada: ${partes.join(', ')}.`
  avisos.atualizar()
  if (mes.value === r.mes) {
    aviso.value = mensagem
    carregar()
  } else {
    avisoAoTrocar = mensagem
    mes.value = r.mes
  }
}

/** Compra adicionada, corrigida, excluída ou atribuída: o "Faltam R$ X" da fatura muda junto (HU-27, HU-29.1). */
async function aoSalvar(mensagem: string) {
  aviso.value = mensagem
  avisos.atualizar()
  await carregar()
  // Quem ficou sem compras some da divisão; o filtro dele não mostraria nada.
  const aindaExiste = fatura.value?.partes.some((p) => (p.pessoaId ?? 'DONO') === filtro.value)
  if (!aindaExiste || !dividida.value) filtro.value = null
}
</script>

<template>
  <NavegadorMes v-model="mes" rotulo="Escolher fatura" :detalhe="mes === cartao.faturaAberta ? 'aberta' : undefined" />

  <template v-if="erroCarga">
    <CaixaAviso :mensagem="erroCarga" />
    <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
  </template>

  <template v-else-if="fatura && fatura.mes === mes">
    <CartaoResumo rotulo="Total da fatura" :valor="reais(fatura.total)" nome="Resumo da fatura" :ocupado="carregando">
      <p class="datas">Fecha {{ diaMes(fatura.fechamento) }} · vence {{ diaMes(fatura.vencimento) }}</p>
      <DivisaoFatura v-if="dividida && pessoas.carregado" v-model:filtro="filtro" :partes="fatura.partes" />
    </CartaoResumo>

    <div class="opcoes">
      <BotaoAcao variante="secundario" @click="seletorArquivo?.click()">Importar arquivo</BotaoAcao>
      <BotaoAcao @click="novaCompra">Adicionar compra</BotaoAcao>
    </div>
    <input ref="seletorArquivo" type="file" class="escondido" tabindex="-1" aria-hidden="true" @change="escolheuArquivo" />
    <TextoAjuda>Importe o PDF ou o OFX da fatura baixado no app do banco, ou digite as compras. Se importar depois de digitar, o app aponta as que parecem iguais e você decide.</TextoAjuda>

    <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />

    <p v-if="filtro" class="filtrando" role="status">
      Só as compras de {{ nomeDoFiltro }}.
      <button type="button" class="ver-todas" @click="filtro = null">Mostrar todas</button>
    </p>

    <ul v-if="fatura.lancamentos.length > 0" class="lista" aria-label="Compras da fatura">
      <LinhaLancamento
        v-for="l in lancamentosVisiveis"
        :key="l.id"
        :item="l"
        :selo="l.origem === 'MANUAL' ? 'digitada' : undefined"
        :clicavel="l.origem === 'MANUAL'"
        :responsavel="pessoas.carregado ? responsavel(l) : undefined"
        @abrir="corrigir(l)"
        @responsavel="trocarResponsavel(l)"
      />
    </ul>
    <EstadoVazio
      v-else
      titulo="Nenhuma compra nesta fatura"
      :texto="`Importe o arquivo baixado no app do ${cartao.banco === 'OUTRO' ? 'seu banco' : cartao.bancoNome} ou adicione as compras uma a uma.`"
    >
      <template #icone><IconeCartao :tamanho="28" /></template>
    </EstadoVazio>

    <ImportarFolha v-model:aberta="importarAberta" :cartao="cartao" :arquivo="arquivo" @importado="aoImportar" />
    <ResponsavelFolha v-model:aberta="responsavelAberta" :lancamento="atribuindo" @salvo="aoSalvar" />
    <CompraFolha v-model:aberta="folhaAberta" :cartao-id="cartao.id" :fatura="fatura" :editando="editando" @salvo="aoSalvar" />
  </template>

  <p v-else class="carregando" role="status">Carregando fatura…</p>
</template>

<style scoped>
.datas {
  font-size: 12px;
  color: var(--escuro-texto-suave);
}

.opcoes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.lista {
  margin: 0;
  padding: 0;
  border-radius: var(--raio-card);
  background: var(--superficie);
  overflow: hidden;
}

.filtrando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ver-todas {
  min-height: var(--toque-minimo);
  padding: 0 4px;
  border: none;
  background: transparent;
  color: var(--marca);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.escondido {
  display: none;
}

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  text-align: center;
}
</style>

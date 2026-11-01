<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import AbasSegmentadas from '@/components/AbasSegmentadas.vue'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CabecalhoAba from '@/components/CabecalhoAba.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CartaoResumo from '@/components/CartaoResumo.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import NavegadorMes from '@/components/NavegadorMes.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { hojeIso, mesPorExtenso, reais } from '@/lib/formatos'
import { useCartoes } from '@/stores/cartoes'
import { useCategorias } from '@/stores/categorias'
import ContaFixaFolha from './ContaFixaFolha.vue'
import GastoFolha from './GastoFolha.vue'
import {
  buscarContasDoMes,
  buscarGastosDoMes,
  type ContaDoMes,
  type ContasDoMes,
  type Gasto,
  type GastosDoMes,
} from './gastos'
import LinhaContaFixa from './LinhaContaFixa.vue'
import LinhaGasto from './LinhaGasto.vue'
import OcorrenciaFolha from './OcorrenciaFolha.vue'

/**
 * Gastos do mês em duas abas. Fixos (HU-11): as contas fixas pelo vencimento, com o total e quanto já foi pago, quanto
 * falta e quanto vai pelo cartão; tocar abre a conta do mês (HU-13). Avulsos (HU-12): os gastos únicos pela data;
 * tocar abre a edição (HU-46).
 */
const categorias = useCategorias()
const cartoes = useCartoes()

const mes = ref(hojeIso().slice(0, 7))
const aba = ref<'FIXOS' | 'AVULSOS'>('FIXOS')
const contas = ref<ContasDoMes | null>(null)
const avulsos = ref<GastosDoMes | null>(null)
const carregando = ref(false)
const erroCarga = ref('')
const aviso = ref('')
const folhaAberta = ref(false)
const editando = ref<ContaDoMes | null>(null)
const ocorrenciaAberta = ref(false)
const aberta = ref<ContaDoMes | null>(null)
const gastoAberto = ref(false)
const gastoEditando = ref<Gasto | null>(null)

async function carregar() {
  erroCarga.value = ''
  carregando.value = true
  const pedido = mes.value
  try {
    const [lidas, lidos] = await Promise.all([
      buscarContasDoMes(pedido),
      buscarGastosDoMes(pedido),
      categorias.carregado ? null : categorias.carregar(),
      cartoes.carregado ? null : cartoes.carregar(),
    ])
    // Trocou de mês enquanto carregava: vale o último pedido.
    if (pedido === mes.value) {
      contas.value = lidas
      avulsos.value = lidos
    }
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  } finally {
    carregando.value = false
  }
}

watch(mes, carregar, { immediate: true })

const nomeMes = computed(() => mesPorExtenso(mes.value).split(' de ')[0])
const abas = computed(() => [
  { valor: 'FIXOS', rotulo: `Fixos (${contas.value?.contas.length ?? 0})` },
  { valor: 'AVULSOS', rotulo: `Avulsos (${avulsos.value?.gastos.length ?? 0})` },
] as const)
const temContaNoCartao = computed(() => (contas.value?.contas ?? []).some((c) => c.conta.formaPagamento === 'CARTAO'))
const temGastoNoCartao = computed(() => (avulsos.value?.gastos ?? []).some((g) => g.formaPagamento === 'CARTAO'))

function nomeCategoria(id: string): string {
  return categorias.porId(id)?.nome ?? 'Outros'
}

function apelido(cartaoId?: string): string | undefined {
  return cartoes.lista.find((x) => x.id === cartaoId)?.apelido
}

function nova() {
  editando.value = null
  folhaAberta.value = true
}

function abrir(c: ContaDoMes) {
  aberta.value = c
  ocorrenciaAberta.value = true
}

function editar() {
  editando.value = aberta.value
  ocorrenciaAberta.value = false
  folhaAberta.value = true
}

function novoGasto() {
  gastoEditando.value = null
  gastoAberto.value = true
}

function abrirGasto(g: Gasto) {
  gastoEditando.value = g
  gastoAberto.value = true
}

function aoSalvar(mensagem: string) {
  aviso.value = mensagem
  carregar()
}

/** O gasto novo aparece na aba dele, no mês dele. */
function aoSalvarGasto(mensagem: string) {
  aba.value = 'AVULSOS'
  aoSalvar(mensagem)
}
</script>

<template>
  <div class="tela">
    <CabecalhoAba titulo="Gastos">
      <template #acoes>
        <button type="button" class="novo" @click="novoGasto">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo gasto
        </button>
      </template>
    </CabecalhoAba>
    <NavegadorMes v-model="mes" rotulo="Mês dos gastos" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="contas && avulsos">
      <CartaoResumo
        v-if="aba === 'FIXOS'"
        :rotulo="`Contas fixas de ${nomeMes}`"
        :valor="reais(contas.total)"
        nome="Resumo das contas fixas"
        :ocupado="carregando"
      >
        <div class="totais">
          <p><span class="rotulo-total">Pago</span><span class="numero pago">{{ reais(contas.pago) }}</span></p>
          <p><span class="rotulo-total">A pagar</span><span class="numero a-pagar">{{ reais(contas.aPagar) }}</span></p>
          <p><span class="rotulo-total">No cartão</span><span class="numero">{{ reais(contas.noCartao) }}</span></p>
        </div>
      </CartaoResumo>
      <CartaoResumo
        v-else
        :rotulo="`Gastos avulsos de ${nomeMes}`"
        :valor="reais(avulsos.total)"
        nome="Resumo dos gastos avulsos"
        :ocupado="carregando"
      >
        <div class="totais">
          <p><span class="rotulo-total">Fora do cartão</span><span class="numero">{{ reais(avulsos.total) }}</span></p>
          <p><span class="rotulo-total">No cartão</span><span class="numero">{{ reais(avulsos.noCartao) }}</span></p>
        </div>
      </CartaoResumo>

      <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />

      <AbasSegmentadas v-model="aba" nome="Tipo de gasto" :abas="abas" />

      <template v-if="aba === 'FIXOS'">
        <EstadoVazio
          v-if="contas.contas.length === 0"
          titulo="Nenhuma conta fixa neste mês"
          texto="Cadastre o que se repete todo mês, como aluguel, escola e internet, para saber quanto já está comprometido."
        />
        <ul v-else class="lista" aria-label="Contas fixas">
          <LinhaContaFixa
            v-for="c in contas.contas"
            :key="c.id"
            :item="c"
            :categoria="nomeCategoria(c.conta.categoriaId)"
            :cartao="apelido(c.conta.cartaoId)"
            @abrir="abrir(c)"
          />
        </ul>
        <TextoAjuda v-if="temContaNoCartao">Conta paga no cartão aparece aqui e na fatura, mas só entra uma vez no total do mês.</TextoAjuda>

        <BotaoAcao @click="nova">Nova conta fixa</BotaoAcao>
      </template>

      <template v-else>
        <EstadoVazio
          v-if="avulsos.gastos.length === 0"
          titulo="Nenhum gasto avulso neste mês"
          texto="Registre o que pagou fora do cartão, como feira, farmácia ou um conserto, para o mês fechar com tudo."
        />
        <ul v-else class="lista" aria-label="Gastos avulsos">
          <LinhaGasto
            v-for="g in avulsos.gastos"
            :key="g.id"
            :item="g"
            :categoria="nomeCategoria(g.categoriaId)"
            :cartao="apelido(g.cartaoId)"
            @abrir="abrirGasto(g)"
          />
        </ul>
        <TextoAjuda v-if="temGastoNoCartao">Gasto no cartão entra no mês pela fatura, não pelo valor registrado aqui.</TextoAjuda>
      </template>
    </template>

    <p v-else class="carregando" role="status">Carregando…</p>

    <OcorrenciaFolha
      v-model:aberta="ocorrenciaAberta"
      :item="aberta"
      :categoria="aberta ? nomeCategoria(aberta.conta.categoriaId) : ''"
      :cartao="aberta ? apelido(aberta.conta.cartaoId) : undefined"
      @salvo="aoSalvar"
      @editar="editar"
    />
    <ContaFixaFolha v-model:aberta="folhaAberta" :editando="editando" @salvo="aoSalvar" />
    <GastoFolha v-model:aberta="gastoAberto" :editando="gastoEditando" @salvo="aoSalvarGasto" />
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.novo {
  min-height: var(--toque-minimo);
  padding: 0 18px;
  border: none;
  border-radius: 24px;
  background: var(--marca);
  color: #FFFFFF;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.totais {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.totais p {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rotulo-total {
  font-size: 12px;
  color: var(--escuro-texto-suave);
}

.numero {
  font-family: var(--fonte-numeros);
  font-size: 13px;
}

.pago {
  color: var(--positivo);
}

.a-pagar {
  color: var(--alerta-forte);
}

.lista {
  margin: 0;
  padding: 0;
  border-radius: var(--raio-card);
  background: var(--superficie);
  overflow: hidden;
}

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  text-align: center;
}
</style>

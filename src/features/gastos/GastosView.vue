<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
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
import { buscarContasDoMes, type ContaDoMes, type ContasDoMes } from './gastos'
import LinhaContaFixa from './LinhaContaFixa.vue'
import OcorrenciaFolha from './OcorrenciaFolha.vue'

/**
 * Gastos (HU-11): as contas fixas do mês, pelo vencimento, com o total e quanto já foi pago, quanto falta e quanto
 * vai pelo cartão. Tocar numa conta abre a conta do mês, para marcar como paga (HU-13); de lá se edita o cadastro.
 */
const categorias = useCategorias()
const cartoes = useCartoes()

const mes = ref(hojeIso().slice(0, 7))
const contas = ref<ContasDoMes | null>(null)
const carregando = ref(false)
const erroCarga = ref('')
const aviso = ref('')
const folhaAberta = ref(false)
const editando = ref<ContaDoMes | null>(null)
const ocorrenciaAberta = ref(false)
const aberta = ref<ContaDoMes | null>(null)

async function carregar() {
  erroCarga.value = ''
  carregando.value = true
  const pedido = mes.value
  try {
    const [lidas] = await Promise.all([
      buscarContasDoMes(pedido),
      categorias.carregado ? null : categorias.carregar(),
      cartoes.carregado ? null : cartoes.carregar(),
    ])
    // Trocou de mês enquanto carregava: vale o último pedido.
    if (pedido === mes.value) contas.value = lidas
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  } finally {
    carregando.value = false
  }
}

watch(mes, carregar, { immediate: true })

const titulo = computed(() => `Contas fixas de ${mesPorExtenso(mes.value).split(' de ')[0]}`)
const temCartao = computed(() => (contas.value?.contas ?? []).some((c) => c.conta.formaPagamento === 'CARTAO'))

function categoria(c: ContaDoMes): string {
  return categorias.porId(c.conta.categoriaId)?.nome ?? 'Outros'
}

function cartao(c: ContaDoMes): string | undefined {
  return cartoes.lista.find((x) => x.id === c.conta.cartaoId)?.apelido
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

function aoSalvar(mensagem: string) {
  aviso.value = mensagem
  carregar()
}
</script>

<template>
  <div class="tela">
    <CabecalhoAba titulo="Gastos" />
    <NavegadorMes v-model="mes" rotulo="Mês das contas" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="contas">
      <CartaoResumo :rotulo="titulo" :valor="reais(contas.total)" nome="Resumo das contas fixas" :ocupado="carregando">
        <div class="totais">
          <p><span class="rotulo-total">Pago</span><span class="numero pago">{{ reais(contas.pago) }}</span></p>
          <p><span class="rotulo-total">A pagar</span><span class="numero a-pagar">{{ reais(contas.aPagar) }}</span></p>
          <p><span class="rotulo-total">No cartão</span><span class="numero">{{ reais(contas.noCartao) }}</span></p>
        </div>
      </CartaoResumo>

      <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />

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
          :categoria="categoria(c)"
          :cartao="cartao(c)"
          @abrir="abrir(c)"
        />
      </ul>
      <TextoAjuda v-if="temCartao">Conta paga no cartão aparece aqui e na fatura, mas só entra uma vez no total do mês.</TextoAjuda>

      <BotaoAcao @click="nova">Nova conta fixa</BotaoAcao>
    </template>

    <p v-else class="carregando" role="status">Carregando…</p>

    <OcorrenciaFolha
      v-model:aberta="ocorrenciaAberta"
      :item="aberta"
      :categoria="aberta ? categoria(aberta) : ''"
      :cartao="aberta ? cartao(aberta) : undefined"
      @salvo="aoSalvar"
      @editar="editar"
    />
    <ContaFixaFolha v-model:aberta="folhaAberta" :editando="editando" @salvo="aoSalvar" />
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

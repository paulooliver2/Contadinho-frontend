<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import BotaoNovo from '@/components/BotaoNovo.vue'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CartaoResumo from '@/components/CartaoResumo.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import NavegadorMes from '@/components/NavegadorMes.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { hojeIso, reais } from '@/lib/formatos'
import LinhaReceita from './LinhaReceita.vue'
import OcorrenciaReceitaFolha from './OcorrenciaReceitaFolha.vue'
import ReceitaFolha from './ReceitaFolha.vue'
import { buscarReceitasDoMes, type Receita, type ReceitaDoMes, type ReceitasDoMes } from './receitas'

/**
 * Receitas do mês (HU-22), pela data: o total, quanto já caiu e quanto ainda está previsto. Tocar abre a receita do
 * mês, para confirmar; de lá se edita o cadastro (HU-46). Pagamento de pessoa não entra aqui (RN-33).
 */
const mes = ref(hojeIso().slice(0, 7))
const receitas = ref<ReceitasDoMes | null>(null)
const carregando = ref(false)
const erroCarga = ref('')
const aviso = ref('')
const folhaAberta = ref(false)
const editando = ref<Receita | null>(null)
const ocorrenciaAberta = ref(false)
const aberta = ref<ReceitaDoMes | null>(null)

async function carregar() {
  erroCarga.value = ''
  carregando.value = true
  const pedido = mes.value
  try {
    const lidas = await buscarReceitasDoMes(pedido)
    // Trocou de mês enquanto carregava: vale o último pedido.
    if (pedido === mes.value) receitas.value = lidas
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  } finally {
    carregando.value = false
  }
}

watch(mes, carregar, { immediate: true })

const vazio = computed(() => receitas.value?.receitas.length === 0)

function nova() {
  editando.value = null
  folhaAberta.value = true
}

function abrir(r: ReceitaDoMes) {
  aberta.value = r
  ocorrenciaAberta.value = true
}

function editar() {
  editando.value = aberta.value?.receita ?? null
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
    <header class="topo">
      <BotaoVoltar :para="{ name: 'inicio' }" rotulo="Voltar para o Início" />
      <h1>Receitas</h1>
      <BotaoNovo texto="Nova receita" @click="nova" />
    </header>
    <NavegadorMes v-model="mes" rotulo="Mês das receitas" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="receitas">
      <CartaoResumo rotulo="Receitas do mês" :valor="reais(receitas.total)" nome="Resumo das receitas" :ocupado="carregando">
        <div class="totais">
          <p><span class="rotulo-total">Recebido</span><span class="numero recebido">{{ reais(receitas.recebido) }}</span></p>
          <p><span class="rotulo-total">Previsto</span><span class="numero">{{ reais(receitas.previsto) }}</span></p>
        </div>
      </CartaoResumo>

      <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />

      <EstadoVazio
        v-if="vazio"
        titulo="Nenhuma receita neste mês"
        texto="Cadastre o salário e o que mais entra, uma vez ou todo mês, para o saldo do mês ser real."
      />
      <ul v-else class="lista" aria-label="Receitas">
        <LinhaReceita v-for="r in receitas.receitas" :key="r.id" :item="r" @abrir="abrir(r)" />
      </ul>
      <TextoAjuda>Dinheiro que alguém te devolveu não entra aqui: ele abate o saldo da pessoa em A receber.</TextoAjuda>
    </template>

    <p v-else class="carregando" role="status">Carregando…</p>

    <OcorrenciaReceitaFolha v-model:aberta="ocorrenciaAberta" :item="aberta" @salvo="aoSalvar" @editar="editar" />
    <ReceitaFolha v-model:aberta="folhaAberta" :editando="editando" :mes="mes" @salvo="aoSalvar" />
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topo {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: var(--toque-minimo);
}

h1 {
  flex: 1;
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.totais {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
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

.recebido {
  color: var(--positivo);
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

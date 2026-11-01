<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import NavegadorMes from '@/components/NavegadorMes.vue'
import { hojeIso } from '@/lib/formatos'
import { useConta } from '@/stores/conta'
import { usePessoas } from '@/stores/pessoas'
import AReceberInicio from './AReceberInicio.vue'
import FaturaAtual from './FaturaAtual.vue'
import OrigemDespesas from './OrigemDespesas.vue'
import ProximasContas from './ProximasContas.vue'
import SaldoDoMes from './SaldoDoMes.vue'
import { buscarProximos, buscarResumoDoMes, type Proximos, type ResumoDoMes } from './resumo'

/**
 * Início: o saldo do mês escolhido (HU-23) e, sempre de agora, as próximas contas, quem deve e a fatura atual de cada
 * cartão (HU-24). Embaixo, de onde vêm as despesas do mês.
 */
const conta = useConta()
const pessoas = usePessoas()
const mes = ref(hojeIso().slice(0, 7))
const resumo = ref<ResumoDoMes | null>(null)
const carregando = ref(false)
const erroCarga = ref('')
const proximos = ref<Proximos | null>(null)
const erroProximos = ref('')

async function carregarProximos() {
  erroProximos.value = ''
  try {
    // Os nomes de quem deve e da divisão vêm das pessoas.
    const [lidos] = await Promise.all([buscarProximos(), pessoas.carregado ? null : pessoas.carregar()])
    proximos.value = lidos
  } catch (e) {
    erroProximos.value = mensagemDeErro(e)
  }
}

onMounted(() => {
  conta.carregar().catch(() => {})
  carregarProximos()
})

async function carregar() {
  erroCarga.value = ''
  carregando.value = true
  const pedido = mes.value
  try {
    const lido = await buscarResumoDoMes(pedido)
    // Trocou de mês enquanto carregava: vale o último pedido.
    if (pedido === mes.value) resumo.value = lido
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  } finally {
    carregando.value = false
  }
}

watch(mes, carregar, { immediate: true })
</script>

<template>
  <div class="tela">
    <header class="topo">
      <h1 class="ola">Olá<template v-if="conta.conta">, {{ conta.conta.nome }}</template></h1>
      <RouterLink :to="{ name: 'configuracoes' }" class="configuracoes" aria-label="Configurações">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </RouterLink>
    </header>
    <NavegadorMes v-model="mes" rotulo="Mês do resumo" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="resumo">
      <SaldoDoMes :resumo="resumo" :ocupado="carregando" />
    </template>

    <p v-else class="carregando" role="status">Carregando…</p>

    <template v-if="erroProximos">
      <CaixaAviso :mensagem="erroProximos" />
      <BotaoAcao variante="secundario" @click="carregarProximos">Tentar de novo</BotaoAcao>
    </template>
    <template v-else-if="proximos">
      <ProximasContas :contas="proximos.contas" />
      <AReceberInicio :a-receber="proximos.aReceber" />
      <FaturaAtual v-for="f in proximos.faturas" :key="f.cartaoId" :fatura="f" />
    </template>

    <OrigemDespesas v-if="resumo && !erroCarga" :resumo="resumo" />
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
  justify-content: space-between;
  align-items: center;
}

.ola {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.configuracoes {
  width: var(--toque-minimo);
  height: var(--toque-minimo);
  margin: 0 -12px 0 auto;
  color: var(--texto);
  display: flex;
  align-items: center;
  justify-content: center;
}

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  text-align: center;
}
</style>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import Interruptor from '@/components/Interruptor.vue'
import LinhaCampos from '@/components/LinhaCampos.vue'
import QuadroResumo from '@/components/QuadroResumo.vue'
import { useAvisos, type Preferencias } from '@/stores/avisos'
import TipoAviso from './TipoAviso.vue'

/**
 * HU-28: cada tipo de aviso liga e desliga, com a antecedência, e o horário silencioso empurra o que cairia nele para
 * o fim. Salva sozinho a cada mudança, no servidor, e reagenda (HU-28.4).
 */
const avisos = useAvisos()
const form = ref<Preferencias | null>(null)
const erroCarga = ref('')
const erro = ref('')
const erroSilencio = ref('')
const salvo = ref(false)

const diasConta = [
  { valor: '1', rotulo: '1 dia' },
  { valor: '2', rotulo: '2 dias' },
  { valor: '3', rotulo: '3 dias' },
] as const
const diasFatura = [
  { valor: '2', rotulo: '2 dias' },
  { valor: '3', rotulo: '3 dias' },
  { valor: '5', rotulo: '5 dias' },
] as const

async function carregar() {
  erroCarga.value = ''
  try {
    const lidas = avisos.preferencias ?? (await avisos.carregarPreferencias())
    form.value = { ...lidas }
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  }
}

onMounted(carregar)

/** Os chips trabalham com texto; a antecedência é número. */
function chip(campo: 'contaAntecedencia' | 'faturaAntecedencia') {
  return computed({
    get: () => (form.value ? String(form.value[campo]) : null),
    set: (v) => {
      if (form.value && v) form.value[campo] = Number(v)
    },
  })
}
const antecedenciaConta = chip('contaAntecedencia')
const antecedenciaFatura = chip('faturaAntecedencia')

const emDias = (dias: number) => (dias === 1 ? 'amanhã' : `em ${dias} dias`)
const hora = (hhmm: string) => {
  const [h, m] = hhmm.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

/** HU-28.3: como cada aviso chega, com a antecedência escolhida. */
const previas = computed(() => {
  const f = form.value
  if (!f) return null
  return {
    conta: `Luz vence ${emDias(f.contaAntecedencia)}: R$ 130,00 · toque para marcar como paga.`,
    fechou: 'Fatura Nubank fechou: importe o arquivo do banco para dividir as compras.',
    receber: `Fatura Nubank vence ${emDias(f.faturaAntecedencia)}: faltam R$ 120,00 de Lucas. Com o botão Cobrar.`,
    silencio:
      f.silencioInicio && f.silencioFim
        ? `Entre ${hora(f.silencioInicio)} e ${hora(f.silencioFim)}, nada toca: o aviso chega às ${hora(f.silencioFim)}.`
        : '',
  }
})

let espera: ReturnType<typeof setTimeout> | undefined
let fila = Promise.resolve()

/** Espera um pouco para juntar mudanças seguidas (os horários) e salva uma de cada vez. */
watch(
  form,
  (atual, anterior) => {
    if (!atual || !anterior) return
    salvo.value = false
    clearTimeout(espera)
    espera = setTimeout(() => (fila = fila.then(() => salvar(atual))), 400)
  },
  { deep: true },
)

async function salvar(f: Preferencias) {
  erro.value = ''
  erroSilencio.value = ''
  if (!f.silencioInicio || !f.silencioFim) {
    erroSilencio.value = 'Informe o início e o fim.'
    return
  }
  if (f.silencioInicio === f.silencioFim) {
    erroSilencio.value = 'O início e o fim do silêncio precisam ser diferentes.'
    return
  }
  try {
    await avisos.salvarPreferencias({ ...f })
    salvo.value = true
  } catch (e) {
    if (e instanceof ErroApi && e.campos.silencioFim) erroSilencio.value = e.campos.silencioFim
    else erro.value = mensagemDeErro(e)
  }
}
</script>

<template>
  <template v-if="erroCarga">
    <CaixaAviso :mensagem="erroCarga" />
    <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
  </template>

  <template v-else-if="form && previas">
    <h2 class="secao">Tipos de aviso</h2>
    <section class="cartao" aria-label="Tipos de aviso">
      <TipoAviso
        v-model="form.contaAtivo"
        rotulo="Contas fixas"
        :descricao="`${form.contaAntecedencia === 1 ? '1 dia' : `${form.contaAntecedencia} dias`} antes e no dia, às 9h`"
        :previa="previas.conta"
      >
        <ChipsEscolha v-model="antecedenciaConta" rotulo="Avisar antes" :opcoes="diasConta" />
      </TipoAviso>
      <TipoAviso
        v-model="form.faturaFechouAtivo"
        rotulo="Fechamento da fatura"
        descricao="No dia seguinte ao fechamento, às 9h"
        :previa="previas.fechou"
      />
      <TipoAviso
        v-model="form.faturaReceberAtivo"
        rotulo="Quem ainda deve da fatura"
        :descricao="`${form.faturaAntecedencia} dias antes do vencimento, às 9h`"
        :previa="previas.receber"
      >
        <ChipsEscolha v-model="antecedenciaFatura" rotulo="Avisar antes do vencimento" :opcoes="diasFatura" />
      </TipoAviso>
    </section>

    <h2 class="secao">Horário silencioso</h2>
    <section class="cartao silencio" aria-label="Horário silencioso">
      <Interruptor v-model="form.silencioAtivo" rotulo="Não avisar à noite" descricao="O aviso espera o fim do período" />
      <template v-if="form.silencioAtivo">
        <LinhaCampos>
          <CampoTexto v-model="form.silencioInicio" rotulo="Das" tipo="time" />
          <CampoTexto v-model="form.silencioFim" rotulo="Até" tipo="time" :erro="erroSilencio" />
        </LinhaCampos>
        <QuadroResumo v-if="previas.silencio" rotulo="Prévia: horário silencioso" :texto="previas.silencio" />
      </template>
    </section>

    <CaixaAviso :mensagem="erro" />
    <p class="salvo" role="status">{{ salvo ? 'Preferências salvas. Valem em qualquer celular em que você entrar.' : '' }}</p>
  </template>
</template>

<style scoped>
.secao {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rotulo);
}

.cartao {
  padding: 4px 16px;
  border-radius: var(--raio-card);
  background: var(--superficie);
  display: flex;
  flex-direction: column;
}

.silencio {
  padding: 12px 16px;
  gap: 10px;
}

.salvo {
  margin: 0;
  min-height: 18px;
  font-size: 13px;
  color: var(--texto-suave);
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { diaMes, mesPorExtenso, reais } from '@/lib/formatos'
import { buscarCandidatas, desligarDaFatura, ligarAFatura, type CompraDaFatura, type ContaDoMes } from './gastos'

/**
 * HU-14: a conta paga no cartão no mês. Na fatura, mostra a compra que a paga e deixa desligar; aguardando, deixa
 * escolher a compra à mão entre as do cartão perto do vencimento.
 */
const props = defineProps<{ item: ContaDoMes; cartao?: string }>()
const emit = defineEmits<{ salvo: [mensagem: string] }>()

const candidatas = ref<CompraDaFatura[] | null>(null)
const procurando = ref(false)
const enviando = ref(false)
const erro = ref('')

watch(
  () => props.item.id,
  () => {
    candidatas.value = null
    erro.value = ''
  },
)

const compra = computed(() => props.item.compra)
const fatura = computed(() => (compra.value ? mesPorExtenso(compra.value.fatura).split(' de ')[0] : ''))

function parcela(c: CompraDaFatura): string {
  return c.parcelaTotal ? ` · ${c.parcelaAtual}/${c.parcelaTotal}` : ''
}

async function procurar() {
  if (procurando.value) return
  procurando.value = true
  erro.value = ''
  try {
    candidatas.value = await buscarCandidatas(props.item.id)
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    procurando.value = false
  }
}

async function executar(acao: () => Promise<string>) {
  if (enviando.value) return
  enviando.value = true
  erro.value = ''
  try {
    emit('salvo', await acao())
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}

function ligar(c: CompraDaFatura) {
  executar(async () => {
    await ligarAFatura(props.item.id, c.id)
    return `${props.item.conta.descricao} ligada à compra ${c.descricao} da fatura.`
  })
}

function desligar() {
  executar(async () => {
    await desligarDaFatura(props.item.id)
    return `${props.item.conta.descricao} voltou a aguardar a fatura.`
  })
}
</script>

<template>
  <div class="ligacao">
    <template v-if="compra">
      <p class="destaque">
        <span>Na fatura de {{ fatura }}</span><span class="numero">{{ reais(compra.valor) }}</span>
      </p>
      <p class="compra">{{ compra.descricao }} · {{ diaMes(compra.data) }}{{ parcela(compra) }} · {{ compra.cartao }}</p>
      <TextoAjuda>
        O total do mês soma a compra da fatura, nunca a conta fixa.
        <template v-if="compra.valor !== item.valorPrevisto">O previsto era {{ reais(item.valorPrevisto) }}.</template>
      </TextoAjuda>
      <CaixaAviso :mensagem="erro" />
      <BotaoAcao variante="secundario" :carregando="enviando" texto-carregando="Desligando…" @click="desligar">
        Não é esta compra
      </BotaoAcao>
    </template>

    <template v-else>
      <p class="destaque">
        <span>Aguardando fatura</span><span class="numero">{{ reais(item.valor) }}</span>
      </p>
      <TextoAjuda>
        Ao importar a fatura{{ cartao ? ` do ${cartao}` : '' }}, o app liga sozinho a compra de valor parecido (até R$ 1
        de diferença) em até 5 dias do vencimento, {{ diaMes(item.vencimento) }}.
      </TextoAjuda>
      <CaixaAviso :mensagem="erro" />

      <BotaoAcao v-if="candidatas === null" variante="secundario" :carregando="procurando" texto-carregando="Procurando…" @click="procurar">
        Escolher a compra na fatura
      </BotaoAcao>
      <TextoAjuda v-else-if="candidatas.length === 0">
        Nenhuma compra deste cartão perto do vencimento. Importe a fatura na aba Cartões.
      </TextoAjuda>
      <ul v-else class="candidatas" aria-label="Compras da fatura">
        <li v-for="c in candidatas" :key="c.id">
          <button type="button" class="candidata" :disabled="enviando" @click="ligar(c)">
            <span class="textos">
              <span class="descricao">{{ c.descricao }}</span>
              <span class="detalhes">{{ diaMes(c.data) }}{{ parcela(c) }} · fatura de {{ mesPorExtenso(c.fatura).split(' de ')[0] }}</span>
            </span>
            <span class="numero">{{ reais(c.valor) }}</span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.ligacao {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.destaque {
  margin: 0;
  display: flex;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
}

.compra {
  margin: -8px 0 0;
  font-size: 13px;
  color: var(--texto-suave);
}

.numero {
  font-family: var(--fonte-numeros);
  white-space: nowrap;
}

.candidatas {
  margin: 0;
  padding: 0;
  border: 1px solid var(--divisoria);
  border-radius: 12px;
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
}

.candidatas li {
  list-style: none;
}

.candidatas li + li {
  border-top: 1px solid var(--divisoria);
}

.candidata {
  width: 100%;
  min-height: 56px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: var(--texto);
  font: inherit;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.textos {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.descricao {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalhes {
  font-size: 12px;
  color: var(--texto-suave);
}
</style>

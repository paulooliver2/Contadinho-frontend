<script setup lang="ts">
import { ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import IconeCartao from '@/components/IconeCartao.vue'
import NavegadorMes from '@/components/NavegadorMes.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { diaMes, reais } from '@/lib/formatos'
import type { Cartao } from '@/stores/cartoes'
import CompraFolha from './CompraFolha.vue'
import { buscarFatura, type Fatura, type Importacao, type Lancamento } from './faturas'
import ImportarFolha from './ImportarFolha.vue'
import LinhaLancamento from './LinhaLancamento.vue'

/**
 * A fatura do cartão, mês a mês, começando pela aberta (RN-58). As duas formas de registrar:
 * importar o arquivo do banco (HU-06) ou digitar compra por compra (HU-47).
 */
const props = defineProps<{ cartao: Cartao }>()

const mes = ref(props.cartao.faturaAberta)
const fatura = ref<Fatura | null>(null)
const carregando = ref(false)
const erroCarga = ref('')
const aviso = ref('')
const folhaAberta = ref(false)
const editando = ref<Lancamento | null>(null)
const seletorArquivo = ref<HTMLInputElement>()
const arquivo = ref<File | null>(null)
const importarAberta = ref(false)

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
  if (mes.value === r.mes) {
    aviso.value = mensagem
    carregar()
  } else {
    avisoAoTrocar = mensagem
    mes.value = r.mes
  }
}

function aoSalvar(mensagem: string) {
  aviso.value = mensagem
  carregar()
}
</script>

<template>
  <NavegadorMes v-model="mes" rotulo="Escolher fatura" :detalhe="mes === cartao.faturaAberta ? 'aberta' : undefined" />

  <template v-if="erroCarga">
    <CaixaAviso :mensagem="erroCarga" />
    <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
  </template>

  <template v-else-if="fatura && fatura.mes === mes">
    <section class="resumo" aria-label="Resumo da fatura" :aria-busy="carregando || undefined">
      <p class="rotulo">Total da fatura</p>
      <p class="total">{{ reais(fatura.total) }}</p>
      <p class="datas">Fecha {{ diaMes(fatura.fechamento) }} · vence {{ diaMes(fatura.vencimento) }}</p>
    </section>

    <div class="opcoes">
      <BotaoAcao variante="secundario" @click="seletorArquivo?.click()">Importar arquivo</BotaoAcao>
      <BotaoAcao @click="novaCompra">Adicionar compra</BotaoAcao>
    </div>
    <input ref="seletorArquivo" type="file" class="escondido" tabindex="-1" aria-hidden="true" @change="escolheuArquivo" />
    <TextoAjuda>Importe o OFX baixado no app do banco ou digite as compras. Se importar depois de digitar, o app aponta as que parecem iguais e você decide.</TextoAjuda>

    <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />

    <ul v-if="fatura.lancamentos.length > 0" class="lista" aria-label="Compras da fatura">
      <LinhaLancamento
        v-for="l in fatura.lancamentos"
        :key="l.id"
        :item="l"
        :selo="l.origem === 'MANUAL' ? 'digitada' : undefined"
        :clicavel="l.origem === 'MANUAL'"
        @abrir="corrigir(l)"
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
    <CompraFolha v-model:aberta="folhaAberta" :cartao-id="cartao.id" :fatura="fatura" :editando="editando" @salvo="aoSalvar" />
  </template>

  <p v-else class="carregando" role="status">Carregando fatura…</p>
</template>

<style scoped>
.resumo {
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--escuro);
  color: var(--fundo);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.resumo p {
  margin: 0;
}

.rotulo,
.datas {
  font-size: 12px;
  color: var(--escuro-texto-suave);
}

.total {
  font-family: var(--fonte-numeros);
  font-size: 28px;
  font-weight: 600;
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

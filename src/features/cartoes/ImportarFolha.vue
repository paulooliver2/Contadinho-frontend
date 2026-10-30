<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import NavegadorMes from '@/components/NavegadorMes.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { reais } from '@/lib/formatos'
import type { Cartao } from '@/stores/cartoes'
import CompraParecida from './CompraParecida.vue'
import { importarFatura, lerArquivo, previaImportacao, type ArquivoLido, type Importacao, type Previa } from './faturas'
import LinhaLancamento from './LinhaLancamento.vue'

/**
 * Importar a fatura (HU-06): prévia com a fatura de destino, os totais e as compras parecidas com as digitadas,
 * que o dono decide uma a uma (RN-59). PDF não é lido nem enviado (HU-39).
 */
const props = defineProps<{ cartao: Cartao; arquivo: File | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ importado: [resultado: Importacao] }>()

const lido = ref<ArquivoLido | null>(null)
const previa = ref<Previa | null>(null)
const mes = ref('')
const decisoes = ref<Record<string, 'MESMA' | 'OUTRA' | null>>({})
const ehPdf = ref(false)
const carregando = ref(false)
const enviando = ref(false)
const erro = ref('')

const banco = computed(() => (props.cartao.banco === 'OUTRO' ? 'do seu banco' : `do ${props.cartao.bancoNome}`))

watch(aberta, async (abriu) => {
  if (!abriu || !props.arquivo) return
  lido.value = null
  previa.value = null
  mes.value = ''
  decisoes.value = {}
  erro.value = ''
  ehPdf.value = props.arquivo.name.toLowerCase().endsWith('.pdf') || props.arquivo.type === 'application/pdf'
  if (ehPdf.value) return
  try {
    lido.value = await lerArquivo(props.arquivo)
  } catch {
    erro.value = 'Não deu para abrir o arquivo. Escolha de novo.'
    return
  }
  await carregar()
})

async function carregar(destino?: string) {
  if (!lido.value) return
  carregando.value = true
  erro.value = ''
  try {
    const lida = await previaImportacao(props.cartao.id, lido.value, destino)
    previa.value = lida
    mes.value = lida.mes
    // Trocar a fatura muda quais digitadas parecem iguais; as decisões recomeçam.
    decisoes.value = Object.fromEntries(lida.itens.filter((i) => i.parecida).map((i) => [i.idExterno, null]))
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    carregando.value = false
  }
}

function trocarFatura(novo: string) {
  mes.value = novo
  carregar(novo)
}

const parecidas = computed(() => previa.value?.itens.filter((i) => i.parecida) ?? [])
const novas = computed(() => previa.value?.itens.filter((i) => !i.jaExiste && !i.parecida) ?? [])
const jaImportadas = computed(() => previa.value?.itens.filter((i) => i.jaExiste) ?? [])
const faltaDecidir = computed(() => Object.values(decisoes.value).some((d) => d === null))

/** RN-12: diferença entre a soma lida e o total que o banco informa no arquivo. */
const diferenca = computed(() => {
  const p = previa.value
  if (!p || p.totalArquivo == null) return 0
  return Math.round((p.totalLido - p.totalArquivo) * 100) / 100
})

const entram = computed(() => {
  const mesmas = Object.values(decisoes.value).filter((d) => d === 'MESMA').length
  return (previa.value?.novos ?? 0) - mesmas
})

async function confirmar() {
  const p = previa.value
  if (!p || !lido.value || enviando.value || faltaDecidir.value) return
  enviando.value = true
  erro.value = ''
  try {
    const mesmas = p.itens
      .filter((i) => i.parecida && decisoes.value[i.idExterno] === 'MESMA')
      .map((i) => ({ idExterno: i.idExterno, lancamentoId: i.parecida!.id }))
    emit('importado', await importarFatura(props.cartao.id, lido.value, p.mes, mesmas))
    aberta.value = false
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" titulo="Importar fatura">
    <template v-if="ehPdf">
      <CaixaAviso mensagem="PDF não é aceito: o app não abre o arquivo nem pede a senha dele." />
      <TextoAjuda>
        No app {{ banco }}, abra a fatura e procure "Exportar" ou "Baixar fatura". Escolha o formato OFX
        (às vezes chamado de "Money" ou "Quicken") e importe esse arquivo aqui.
      </TextoAjuda>
      <BotaoAcao variante="secundario" @click="aberta = false">Entendi</BotaoAcao>
    </template>

    <template v-else>
      <p class="arquivo">{{ arquivo?.name }}</p>

      <NavegadorMes v-if="mes" :model-value="mes" rotulo="Fatura de destino" detalhe="destino" @update:model-value="trocarFatura" />

      <!-- Enquanto a prévia do mês escolhido não chega, a do mês anterior não aparece com o nome errado. -->
      <template v-if="previa && previa.mes === mes">

        <section class="numeros" aria-label="Resumo da importação" :aria-busy="carregando || undefined">
          <p><strong>{{ previa.novos }}</strong> {{ previa.novos === 1 ? 'compra nova' : 'compras novas' }}</p>
          <p v-if="previa.jaExistiam > 0">{{ previa.jaExistiam }} já {{ previa.jaExistiam === 1 ? 'importada' : 'importadas' }} antes, {{ previa.jaExistiam === 1 ? 'fica' : 'ficam' }} de fora</p>
          <p v-if="previa.ignorados > 0">{{ previa.ignorados }} {{ previa.ignorados === 1 ? 'pagamento da fatura ignorado' : 'pagamentos da fatura ignorados' }}</p>
          <p>Soma do arquivo: <span class="valor">{{ reais(previa.totalLido) }}</span></p>
        </section>

        <TextoAjuda v-if="diferenca !== 0" tom="aviso">
          O banco informa {{ reais(previa.totalArquivo!) }} no arquivo, mas a soma lida dá {{ reais(previa.totalLido) }}
          (diferença de {{ reais(Math.abs(diferenca)) }}). Confira antes de importar.
        </TextoAjuda>

        <template v-if="parecidas.length > 0">
          <h3>Parecem compras que você digitou</h3>
          <TextoAjuda>Mesma data e mesmo valor. Se for a mesma, a digitada passa a ser a do arquivo e mantém o responsável.</TextoAjuda>
          <CompraParecida v-for="item in parecidas" :key="item.idExterno" v-model="decisoes[item.idExterno]!" :item="item" />
        </template>

        <template v-if="novas.length > 0">
          <h3>Entram na fatura</h3>
          <ul class="lista">
            <LinhaLancamento v-for="item in novas" :key="item.idExterno" :item="item" />
          </ul>
        </template>

        <template v-if="jaImportadas.length > 0">
          <h3>Já importadas</h3>
          <ul class="lista">
            <LinhaLancamento v-for="item in jaImportadas" :key="item.idExterno" :item="item" selo="já importada" />
          </ul>
        </template>

        <CaixaAviso :mensagem="erro" />

        <TextoAjuda v-if="faltaDecidir" tom="aviso">Diga se cada compra parecida é a mesma ou outra para importar.</TextoAjuda>
        <BotaoAcao v-if="previa.novos > 0" :desativado="faltaDecidir || carregando" :carregando="enviando" texto-carregando="Importando…" @click="confirmar">
          {{ entram > 0 ? `Importar ${entram} ${entram === 1 ? 'compra' : 'compras'}` : 'Confirmar importação' }}
        </BotaoAcao>
        <BotaoAcao v-else variante="secundario" @click="aberta = false">Nada novo para importar</BotaoAcao>
      </template>

      <template v-else-if="erro">
        <CaixaAviso :mensagem="erro" />
        <BotaoAcao variante="secundario" @click="aberta = false">Entendi</BotaoAcao>
      </template>

      <p v-else class="carregando" role="status">Lendo o arquivo…</p>
    </template>
  </FolhaInferior>
</template>

<style scoped>
.arquivo {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  overflow-wrap: anywhere;
}

.numeros {
  padding: 14px 16px;
  border-radius: var(--raio-card);
  background: var(--fundo);
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}

.numeros p {
  margin: 0;
}

.valor {
  font-family: var(--fonte-numeros);
}

h3 {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 700;
}

.lista {
  margin: 0;
  padding: 0;
  border-radius: var(--raio-card);
  border: 1px solid var(--divisoria);
}

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
}
</style>

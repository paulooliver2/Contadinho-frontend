<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { diaMes, reais } from '@/lib/formatos'
import { usePessoas } from '@/stores/pessoas'
import { atribuirResponsavel, type Lancamento } from './faturas'

/**
 * HU-08: de quem é a compra, entre "Você" e as pessoas ativas. Numa parcela com outras pela frente, pergunta se as
 * próximas também são dessa pessoa (RN-17). A sugerida pelas últimas vezes (HU-09) pode ser confirmada como está.
 */
const props = defineProps<{ lancamento: Lancamento | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string] }>()

const pessoas = usePessoas()

/** "Você" não tem id; na escolha ele é este valor. */
const VOCE = 'VOCE'
const escolha = ref<string | null>(null)
const perguntandoProximas = ref(false)
const erro = ref('')
const enviando = ref(false)

watch(aberta, (abriu) => {
  if (!abriu) return
  escolha.value = props.lancamento?.pessoaId ?? VOCE
  perguntandoProximas.value = false
  erro.value = ''
})

const opcoes = computed(() => {
  const lista = [{ valor: VOCE, rotulo: 'Você' }, ...pessoas.ativas.map((p) => ({ valor: p.id, rotulo: p.apelido ?? p.nome }))]
  // A pessoa atual, se foi arquivada, não está entre as ativas, mas precisa aparecer marcada (RN-36).
  const atual = props.lancamento?.pessoaId
  if (atual && !pessoas.ativas.some((p) => p.id === atual)) lista.push({ valor: atual, rotulo: pessoas.rotulo(atual) })
  return lista
})

const restantes = computed(() => {
  const l = props.lancamento
  return l?.parcelaAtual && l.parcelaTotal ? l.parcelaTotal - l.parcelaAtual : 0
})

const nomeEscolhido = computed(() => (escolha.value === VOCE || !escolha.value ? 'você' : pessoas.rotulo(escolha.value)))

function escolher(valor: string | null) {
  if (!valor || enviando.value) return
  escolha.value = valor
  if (restantes.value > 0) perguntandoProximas.value = true
  else salvar(false)
}

async function salvar(proximas: boolean) {
  const l = props.lancamento
  if (!l || enviando.value) return
  enviando.value = true
  erro.value = ''
  const pessoaId = escolha.value === VOCE ? null : escolha.value
  try {
    const r = await atribuirResponsavel(l.id, pessoaId, proximas)
    const quem = pessoaId ? `é de ${pessoas.rotulo(pessoaId)}` : 'voltou para você'
    const junto = proximas ? ', e as próximas parcelas também' : ''
    const jaGravadas = r.proximas > 0 ? ` (${r.proximas} já ${r.proximas === 1 ? 'lançada mudou' : 'lançadas mudaram'} junto)` : ''
    emit('salvo', `${l.descricao} ${quem}${junto}${jaGravadas}.`)
    aberta.value = false
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" titulo="De quem é esta compra?">
    <div v-if="lancamento" class="conteudo">
      <p class="compra">
        <span class="descricao">{{ lancamento.descricao }}</span>
        <span class="detalhes">
          {{ diaMes(lancamento.data) }}
          <template v-if="lancamento.parcelaAtual"> · parcela {{ lancamento.parcelaAtual }}/{{ lancamento.parcelaTotal }}</template>
          · {{ reais(lancamento.valor) }}
        </span>
      </p>

      <template v-if="!perguntandoProximas">
        <template v-if="lancamento.sugerido && lancamento.pessoaId">
          <TextoAjuda tom="aviso">
            Sugerido: {{ pessoas.rotulo(lancamento.pessoaId) }} ficou com esta compra nas duas últimas vezes.
          </TextoAjuda>
          <BotaoAcao :carregando="enviando" texto-carregando="Salvando…" @click="salvar(false)">
            Está certo, é de {{ pessoas.rotulo(lancamento.pessoaId) }}
          </BotaoAcao>
        </template>
        <ChipsEscolha :model-value="escolha" rotulo="Responsável" :opcoes="opcoes" @update:model-value="escolher" />
        <template v-if="pessoas.ativas.length === 0">
          <TextoAjuda>Ainda não há pessoas cadastradas. Cadastre em A receber quem usa seu cartão.</TextoAjuda>
          <BotaoAcao variante="secundario" para="/receber">Cadastrar pessoas</BotaoAcao>
        </template>
        <TextoAjuda v-else>Sem responsável, a compra conta como sua.</TextoAjuda>
      </template>

      <template v-else>
        <p class="pergunta">
          {{ restantes === 1 ? 'A última parcela também é' : `As próximas ${restantes} parcelas também são` }}
          {{ escolha === VOCE ? 'suas' : `de ${nomeEscolhido}` }}?
        </p>
        <TextoAjuda>Elas chegam já marcadas quando a fatura de cada mês for importada.</TextoAjuda>
        <BotaoAcao :carregando="enviando" texto-carregando="Salvando…" @click="salvar(true)">
          Sim, as próximas também
        </BotaoAcao>
        <BotaoAcao variante="secundario" :desativado="enviando" @click="salvar(false)">Só esta parcela</BotaoAcao>
      </template>

      <CaixaAviso :mensagem="erro" />
    </div>
  </FolhaInferior>
</template>

<style scoped>
.conteudo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.compra {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.descricao {
  font-size: 15px;
  font-weight: 600;
}

.detalhes {
  font-size: 13px;
  color: var(--texto-suave);
}

.pergunta {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
</style>

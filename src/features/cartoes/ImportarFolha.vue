<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import NavegadorMes from '@/components/NavegadorMes.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { reais } from '@/lib/formatos'
import type { Cartao } from '@/stores/cartoes'
import { usePessoas } from '@/stores/pessoas'
import CompraParecida from './CompraParecida.vue'
import { importarFatura, lerArquivo, previaImportacao, type ArquivoLido, type Importacao, type Previa } from './faturas'
import LinhaLancamento from './LinhaLancamento.vue'

/**
 * Importar a fatura em PDF ou OFX (HU-06, HU-39): prévia com a fatura de destino, os totais e as compras parecidas
 * com as digitadas, que o dono decide uma a uma (RN-59). PDF com senha pede a senha antes da prévia. As compras que
 * foram da mesma pessoa nas últimas vezes já vêm com ela, marcadas como sugeridas (HU-09).
 */
const props = defineProps<{ cartao: Cartao; arquivo: File | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ importado: [resultado: Importacao] }>()

const pessoas = usePessoas()
const lido = ref<ArquivoLido | null>(null)
const previa = ref<Previa | null>(null)
const mes = ref('')
const decisoes = ref<Record<string, 'MESMA' | 'OUTRA' | null>>({})
const carregando = ref(false)
const enviando = ref(false)
const erro = ref('')
const pedeSenha = ref(false)
const senha = ref('')
const erroSenha = ref('')

watch(aberta, async (abriu) => {
  if (!abriu || !props.arquivo) return
  lido.value = null
  previa.value = null
  mes.value = ''
  decisoes.value = {}
  erro.value = ''
  pedeSenha.value = false
  senha.value = ''
  erroSenha.value = ''
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
    // HU-39: o PDF tem senha (ou a digitada não abriu); a folha mostra o campo da senha.
    if (e instanceof ErroApi && (e.codigo === 'SENHA_PDF' || e.codigo === 'SENHA_PDF_INCORRETA')) {
      pedeSenha.value = true
      erroSenha.value = e.codigo === 'SENHA_PDF_INCORRETA' ? e.message : ''
    } else {
      erro.value = mensagemDeErro(e)
    }
  } finally {
    carregando.value = false
  }
}

function abrirComSenha() {
  if (!lido.value || carregando.value) return
  if (!senha.value) {
    erroSenha.value = 'Digite a senha do PDF.'
    return
  }
  erroSenha.value = ''
  lido.value = { ...lido.value, senha: senha.value }
  carregar()
}

function trocarFatura(novo: string) {
  mes.value = novo
  carregar(novo)
}

const parecidas = computed(() => previa.value?.itens.filter((i) => i.parecida) ?? [])
const novas = computed(() => previa.value?.itens.filter((i) => !i.jaExiste && !i.parecida) ?? [])
const sugeridas = computed(() => novas.value.filter((i) => i.pessoaSugeridaId).length)
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
    <p class="arquivo">{{ arquivo?.name }}</p>

    <FormularioEmpilhado v-if="pedeSenha && !previa" @enviar="abrirComSenha">
      <TextoAjuda>Este PDF tem senha. Ela só é usada para abrir o arquivo e não fica guardada no app.</TextoAjuda>
      <CampoTexto v-model="senha" rotulo="Senha do PDF" tipo="password" autocomplete="off" :erro="erroSenha" />
      <BotaoAcao tipo="submit" :carregando="carregando" texto-carregando="Abrindo…">Abrir fatura</BotaoAcao>
    </FormularioEmpilhado>

    <template v-else>

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
          <TextoAjuda v-if="sugeridas > 0">
            {{ sugeridas === 1 ? 'A compra marcada como sugerida já vai' : 'As compras marcadas como sugeridas já vão' }}
            para quem ficou com ela nas duas últimas vezes. Dá para trocar depois, na fatura.
          </TextoAjuda>
          <ul class="lista">
            <LinhaLancamento
              v-for="item in novas"
              :key="item.idExterno"
              :item="item"
              :selo="item.pessoaSugeridaId ? `${pessoas.rotulo(item.pessoaSugeridaId)} · sugerido` : undefined"
            />
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

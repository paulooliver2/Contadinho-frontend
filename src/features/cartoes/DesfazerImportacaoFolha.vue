<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { reais } from '@/lib/formatos'
import { usePessoas } from '@/stores/pessoas'
import { desfazerImportacao, previaDesfazer, type DesfazerImportacao, type ImportacaoDaFatura } from './faturas'

/**
 * HU-44: antes de desfazer, mostra o que sai e o que volta, e avisa quando alguém já tinha pago parte das compras
 * (HU-44.2): o pagamento continua e passa a abater o resto, ou vira crédito (RN-16).
 */
const props = defineProps<{ importacao: ImportacaoDaFatura | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ desfeito: [mensagem: string] }>()

const pessoas = usePessoas()
const previa = ref<DesfazerImportacao | null>(null)
const erro = ref('')
const enviando = ref(false)

watch(aberta, async (abriu) => {
  if (!abriu || !props.importacao) return
  previa.value = null
  erro.value = ''
  try {
    previa.value = await previaDesfazer(props.importacao.id)
  } catch (e) {
    erro.value = mensagemDeErro(e)
  }
})

const plural = (n: number, um: string, varios: string) => (n === 1 ? `1 ${um}` : `${n} ${varios}`)

const pagos = computed(() =>
  (previa.value?.pagos ?? []).map((p) => `${pessoas.rotulo(p.pessoaId)} já pagou ${reais(p.valor)} destas compras.`),
)

async function desfazer() {
  const p = previa.value
  if (!p || enviando.value) return
  enviando.value = true
  erro.value = ''
  try {
    await desfazerImportacao(p.id)
    aberta.value = false
    emit('desfeito', `Importação desfeita: ${plural(p.removidas, 'compra saiu', 'compras saíram')} da fatura.`)
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" titulo="Desfazer importação">
    <div class="conteudo">
      <template v-if="previa">
        <p class="texto">
          Saem da fatura {{ plural(previa.removidas, 'compra', 'compras') }} de <strong>{{ previa.nomeArquivo }}</strong>,
          e com elas o que as pessoas deviam por elas.
        </p>
        <p v-if="previa.voltamADigitadas > 0" class="texto">
          {{ plural(previa.voltamADigitadas, 'compra que você digitou antes volta a ser digitada', 'compras que você digitou antes voltam a ser digitadas') }}.
        </p>
        <p class="texto">Contas fixas e gastos ligados a essas compras voltam a aguardar a fatura.</p>
        <div v-if="pagos.length" class="pagos" role="status">
          <TextoAjuda v-for="t in pagos" :key="t" tom="aviso">{{ t }}</TextoAjuda>
          <TextoAjuda tom="aviso">O pagamento continua registrado: abate o que ainda falta pagar ou fica como crédito.</TextoAjuda>
        </div>
      </template>
      <p v-else-if="!erro" class="texto" role="status">Carregando…</p>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao :desativado="!previa" :carregando="enviando" texto-carregando="Desfazendo…" @click="desfazer">
        Desfazer importação
      </BotaoAcao>
      <TextoAjuda>Depois, é só importar o arquivo de novo no cartão e na fatura certos.</TextoAjuda>
    </div>
  </FolhaInferior>
</template>

<style scoped>
.conteudo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.texto {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.pagos {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import LinhaCampos from '@/components/LinhaCampos.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { diaMes, hojeIso, lerValor, valorParaCampo } from '@/lib/formatos'
import { adicionarCompra, corrigirCompra, excluirCompra, type Compra, type Fatura, type Lancamento } from './faturas'

/** HU-47: digitar uma compra na fatura, ou corrigir e excluir uma já digitada (RN-60). */
const props = defineProps<{ cartaoId: string; fatura: Fatura; editando: Lancamento | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string] }>()

type Tipo = 'COMPRA' | 'ESTORNO'
const tipos = [
  { valor: 'COMPRA', rotulo: 'Compra' },
  { valor: 'ESTORNO', rotulo: 'Estorno' },
] as const

const tipo = ref<Tipo | null>('COMPRA')
const data = ref('')
const descricao = ref('')
const valor = ref('')
const parcelaAtual = ref('')
const parcelaTotal = ref('')
const erros = useErrosDeCampos({ data, descricao, valor, parcela: [parcelaAtual, parcelaTotal] })
const erro = ref('')
const enviando = ref(false)
const confirmandoExclusao = ref(false)

/** RN-60: a compra não pode ser depois do fechamento. Hoje, se a fatura ainda está aberta. */
const dataMaxima = computed(() => props.fatura.fechamento)

watch(aberta, (abriu) => {
  if (!abriu) return
  const l = props.editando
  tipo.value = l && l.valor < 0 ? 'ESTORNO' : 'COMPRA'
  data.value = l?.data ?? (hojeIso() < dataMaxima.value ? hojeIso() : dataMaxima.value)
  descricao.value = l?.descricao ?? ''
  valor.value = l ? valorParaCampo(l.valor) : ''
  parcelaAtual.value = l?.parcelaAtual ? String(l.parcelaAtual) : ''
  parcelaTotal.value = l?.parcelaTotal ? String(l.parcelaTotal) : ''
  erros.value = {}
  erro.value = ''
  confirmandoExclusao.value = false
})

function numero(texto: string): number | null {
  return /^\d{1,2}$/.test(texto) && Number(texto) >= 1 ? Number(texto) : null
}

/** As mesmas regras do servidor (RN-60), para avisar antes de enviar. */
function montar(): Compra | null {
  const novos: Record<string, string> = {}
  const lido = lerValor(valor.value)
  if (!data.value) novos.data = 'Informe a data.'
  else if (data.value > dataMaxima.value) novos.data = `A fatura fecha em ${diaMes(dataMaxima.value)}; use uma data até lá.`
  if (!descricao.value.trim()) novos.descricao = 'Informe a descrição.'
  if (lido === null) novos.valor = 'Use um valor como 120,50.'
  else if (lido === 0) novos.valor = 'Informe um valor diferente de zero.'
  const atual = numero(parcelaAtual.value)
  const total = numero(parcelaTotal.value)
  const temParcela = parcelaAtual.value !== '' || parcelaTotal.value !== ''
  if (temParcela && (atual === null || total === null)) novos.parcela = 'Informe a parcela e o total, como 3 de 10.'
  else if (atual !== null && total !== null && atual > total) novos.parcela = 'A parcela não pode passar do total.'
  erros.value = novos
  if (Object.keys(novos).length > 0) return null
  return {
    data: data.value,
    descricao: descricao.value.trim(),
    valor: tipo.value === 'ESTORNO' ? -lido! : lido!,
    parcelaAtual: atual ?? undefined,
    parcelaTotal: total ?? undefined,
  }
}

function camposDoServidor(campos: Record<string, string>): Record<string, string> {
  const { parcelaAtual: a, parcelaTotal: t, ...resto } = campos
  const parcela = resto.parcela ?? a ?? t
  return parcela ? { ...resto, parcela } : resto
}

async function salvar() {
  if (enviando.value) return
  erro.value = ''
  const compra = montar()
  if (!compra) return
  enviando.value = true
  try {
    if (props.editando) await corrigirCompra(props.editando.id, compra)
    else await adicionarCompra(props.cartaoId, props.fatura.mes, compra)
    emit('salvo', props.editando ? 'Compra corrigida.' : `${compra.descricao} adicionada.`)
    aberta.value = false
  } catch (e) {
    if (e instanceof ErroApi && Object.keys(e.campos).length > 0) erros.value = camposDoServidor(e.campos)
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}

async function excluir() {
  if (!props.editando || enviando.value) return
  if (!confirmandoExclusao.value) {
    confirmandoExclusao.value = true
    return
  }
  enviando.value = true
  erro.value = ''
  try {
    await excluirCompra(props.editando.id)
    emit('salvo', `${props.editando.descricao} excluída.`)
    aberta.value = false
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="editando ? 'Corrigir compra' : 'Adicionar compra'">
    <FormularioEmpilhado @enviar="salvar">
      <ChipsEscolha v-model="tipo" rotulo="Tipo" :opcoes="tipos">
        <TextoAjuda v-if="tipo === 'ESTORNO'">Estorno é dinheiro devolvido pelo banco: abate o total da fatura.</TextoAjuda>
      </ChipsEscolha>

      <CampoTexto v-model="descricao" rotulo="Descrição" placeholder="Ex.: Mercado Bom Preço" :maxlength="255" :erro="erros.descricao" />

      <LinhaCampos>
        <CampoTexto v-model="valor" rotulo="Valor (R$)" placeholder="0,00" decimal autocomplete="off" :erro="erros.valor" />
        <CampoTexto v-model="data" rotulo="Data" tipo="date" :max="dataMaxima" :erro="erros.data" />
      </LinhaCampos>

      <div class="parcela">
        <LinhaCampos>
          <CampoTexto v-model="parcelaAtual" rotulo="Parcela" placeholder="Ex.: 3" numerico :maxlength="2" autocomplete="off" />
          <CampoTexto v-model="parcelaTotal" rotulo="de" placeholder="Ex.: 10" numerico :maxlength="2" autocomplete="off" />
        </LinhaCampos>
        <p v-if="erros.parcela" class="erro-parcela" role="alert">{{ erros.parcela }}</p>
        <TextoAjuda v-else>Deixe em branco se a compra foi à vista.</TextoAjuda>
      </div>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Salvando…">
        {{ editando ? 'Salvar correção' : 'Adicionar compra' }}
      </BotaoAcao>
      <BotaoAcao v-if="editando" variante="secundario" :desativado="enviando" @click="excluir">
        {{ confirmandoExclusao ? 'Toque de novo para excluir' : 'Excluir compra' }}
      </BotaoAcao>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

<style scoped>
.parcela {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.erro-parcela {
  margin: 0;
  font-size: 13px;
  color: var(--perigo);
}
</style>

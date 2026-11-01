<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { EXEMPLO_PIX, formatarChave, TIPOS_PIX } from '@/lib/pix'
import { useConta, type Pix, type TipoPix } from '@/stores/conta'

/**
 * HU-03.1: tipo e chave Pix, validados pelo servidor pelo formato do tipo. Fica nas Configurações e, sem chave, na
 * própria cobrança (HU-03.2). Vem preenchido com a chave atual.
 */
const emit = defineEmits<{ salva: [pix: Pix] }>()

const conta = useConta()

const tipo = ref<TipoPix | null>(conta.conta?.pix?.tipo ?? 'CELULAR')
const chave = ref(atual())
const erros = useErrosDeCampos({ chave: [chave, tipo] })
const erro = ref('')
const enviando = ref(false)

function atual(): string {
  const pix = conta.conta?.pix
  return pix ? formatarChave(pix.tipo, pix.chave) : ''
}

// Outra tela salvou ou removeu a chave: o campo acompanha.
watch(() => conta.conta?.pix, (pix) => {
  if (pix) tipo.value = pix.tipo
  chave.value = atual()
})

const salva = computed(() => {
  const pix = conta.conta?.pix
  return !!pix && pix.tipo === tipo.value && formatarChave(pix.tipo, pix.chave) === chave.value.trim()
})

async function salvar() {
  if (!tipo.value || salva.value || enviando.value) return
  if (!chave.value.trim()) {
    erros.value = { chave: 'Informe a chave.' }
    return
  }
  enviando.value = true
  erro.value = ''
  try {
    emit('salva', await conta.salvarPix(tipo.value, chave.value))
  } catch (e) {
    if (e instanceof ErroApi && Object.keys(e.campos).length > 0) erros.value = e.campos
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FormularioEmpilhado @enviar="salvar">
    <ChipsEscolha v-model="tipo" rotulo="Tipo da chave" :opcoes="TIPOS_PIX" />
    <CampoTexto
      v-model="chave"
      rotulo="Chave Pix"
      :tipo="tipo === 'EMAIL' ? 'email' : tipo === 'CELULAR' ? 'tel' : 'text'"
      :numerico="tipo === 'CPF'"
      :placeholder="tipo ? EXEMPLO_PIX[tipo] : ''"
      :maxlength="100"
      autocomplete="off"
      :erro="erros.chave"
    />
    <TextoAjuda v-if="salva">Chave salva. Ela vai em todas as cobranças.</TextoAjuda>
    <CaixaAviso :mensagem="erro" />
    <BotaoAcao tipo="submit" :variante="salva ? 'secundario' : 'principal'" :desativado="salva" :carregando="enviando" texto-carregando="Salvando…">
      {{ salva ? 'Salva' : 'Salvar chave' }}
    </BotaoAcao>
  </FormularioEmpilhado>
</template>

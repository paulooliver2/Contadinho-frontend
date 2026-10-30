<script setup lang="ts">
import { computed, ref } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import IconeEnvelope from '@/components/IconeEnvelope.vue'
import TelaAcesso from '@/components/TelaAcesso.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { pedirLinkDeRecuperacao } from './recuperacao'

const email = ref('')
const erroEmail = ref('')
const erro = ref('')
const enviando = ref(false)
const enviado = ref(false)

const textos = computed(() =>
  enviado.value
    ? { titulo: 'Confira seu e-mail', subtitulo: 'O link chega em alguns minutos. Olhe também a caixa de spam.' }
    : { titulo: 'Recuperar senha', subtitulo: 'Informe o e-mail da conta. Vamos mandar um link para você criar uma senha nova.' },
)

async function enviar() {
  if (enviando.value) return
  erro.value = ''
  erroEmail.value = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()) ? '' : 'Informe um e-mail válido.'
  if (erroEmail.value) return
  enviando.value = true
  try {
    await pedirLinkDeRecuperacao(email.value)
    enviado.value = true
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaAcesso
    :titulo="textos.titulo"
    :subtitulo="textos.subtitulo"
    :voltar="{ para: { name: 'entrar' }, rotulo: 'Voltar para entrar' }"
    :rodape="{ pergunta: 'Lembrou a senha?', link: 'Entrar', para: { name: 'entrar' } }"
  >
    <FormularioEmpilhado v-if="!enviado" @enviar="enviar">
      <CampoTexto v-model="email" rotulo="E-mail" tipo="email" autocomplete="email" placeholder="voce@email.com" :erro="erroEmail" />
      <TextoAjuda>Por segurança, a resposta é sempre a mesma, exista ou não uma conta com esse e-mail.</TextoAjuda>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :desativado="!email" :carregando="enviando" texto-carregando="Enviando…">
        Enviar link
      </BotaoAcao>
    </FormularioEmpilhado>

    <template v-else>
      <CaixaAviso tom="sucesso">
        <template #icone><IconeEnvelope /></template>
        Se o e-mail <b>{{ email.trim() }}</b> estiver cadastrado, enviamos um link. Ele vale por 30 minutos.
      </CaixaAviso>
      <BotaoAcao variante="secundario" @click="enviado = false">Não chegou? Enviar de novo</BotaoAcao>
    </template>
  </TelaAcesso>
</template>

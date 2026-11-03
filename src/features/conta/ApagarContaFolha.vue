<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import { useConta } from '@/stores/conta'

/** HU-04: apaga a conta e tudo dela, sem volta, confirmando com a senha (RN-56). */
const aberta = defineModel<boolean>('aberta', { required: true })

const conta = useConta()
const router = useRouter()
const senha = ref('')
const erroSenha = ref('')
const erro = ref('')
const apagando = ref(false)

async function apagar() {
  if (apagando.value || !senha.value) return
  apagando.value = true
  erroSenha.value = ''
  erro.value = ''
  try {
    await conta.apagar(senha.value)
    aberta.value = false
    await router.replace({ name: 'entrar', query: { conta: 'apagada' } })
  } catch (e) {
    if (e instanceof ErroApi && e.campos.senha) erroSenha.value = e.campos.senha
    else erro.value = mensagemDeErro(e)
  } finally {
    apagando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" titulo="Apagar sua conta?">
    <FormularioEmpilhado @enviar="apagar">
      <p class="aviso">
        Isso apaga para sempre seus cartões, faturas, gastos, receitas, pessoas e o que te devem. Não dá para desfazer.
      </p>
      <CampoTexto v-model="senha" rotulo="Senha" tipo="password" autocomplete="current-password" placeholder="Sua senha" :erro="erroSenha" />
      <CaixaAviso :mensagem="erro" />
      <BotaoAcao tipo="submit" :desativado="!senha" :carregando="apagando" texto-carregando="Apagando…">Apagar para sempre</BotaoAcao>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

<style scoped>
.aviso {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: var(--texto);
}
</style>

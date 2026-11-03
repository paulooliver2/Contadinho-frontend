<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import TelaAcesso from '@/components/TelaAcesso.vue'
import { useSessao } from '@/stores/sessao'
import { useTrava } from '@/stores/trava'

const route = useRoute()
const router = useRouter()
const sessao = useSessao()
const trava = useTrava()

const email = ref('')
const senha = ref('')
const erro = ref('')
const enviando = ref(false)
/** Volta da tela de senha nova (HU-40). */
const senhaRedefinida = route.query.senha === 'redefinida'

async function entrar() {
  if (enviando.value || !email.value || !senha.value) return
  erro.value = ''
  enviando.value = true
  try {
    await sessao.entrar(email.value, senha.value)
    // HU-02: oferece a biometria logo depois do login com senha (RN-05).
    await trava.oferecer(email.value).catch(() => undefined)
    await router.replace(typeof route.query.voltar === 'string' ? route.query.voltar : '/')
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaAcesso
    titulo="Entrar no Contadinho"
    subtitulo="Use o e-mail e a senha da sua conta."
    com-logo
    :rodape="{ pergunta: 'Ainda não tem conta?', link: 'Criar conta', para: { name: 'criar-conta' } }"
  >
    <FormularioEmpilhado @enviar="entrar">
      <CaixaAviso v-if="senhaRedefinida" tom="sucesso" mensagem="Senha alterada. Entre com a senha nova." />
      <CampoTexto v-model="email" rotulo="E-mail" tipo="email" autocomplete="email" placeholder="voce@email.com" />
      <CampoTexto v-model="senha" rotulo="Senha" tipo="password" autocomplete="current-password" placeholder="Sua senha" />
      <RouterLink :to="{ name: 'recuperar-senha' }" class="esqueci">Esqueci a senha</RouterLink>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :desativado="!email || !senha" :carregando="enviando" texto-carregando="Entrando…">
        Entrar
      </BotaoAcao>
    </FormularioEmpilhado>
  </TelaAcesso>
</template>

<style scoped>
.esqueci {
  align-self: flex-end;
  min-height: var(--toque-minimo);
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}
</style>

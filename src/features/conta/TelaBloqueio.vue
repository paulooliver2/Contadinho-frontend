<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import TelaAcesso from '@/components/TelaAcesso.vue'
import { useSessao } from '@/stores/sessao'
import { useTrava } from '@/stores/trava'

/**
 * HU-02: cobre o app inteiro até a biometria dar certo. Depois de 3 falhas ou do bloqueio do sistema, pede a senha
 * da conta (HU-02.2). Sempre dá para sair da conta.
 */
const trava = useTrava()
const sessao = useSessao()
const router = useRouter()

const senha = ref('')
const erro = ref('')
const enviando = ref(false)

onMounted(() => {
  // Uma folha aberta (<dialog> modal) deixaria esta tela sem resposta ao toque: fecha antes.
  document.querySelectorAll<HTMLDialogElement>('dialog[open]').forEach((d) => d.close())
  trava.tentarBiometria()
})

async function desbloquear() {
  if (enviando.value || !senha.value) return
  erro.value = ''
  enviando.value = true
  try {
    await trava.desbloquearComSenha(senha.value)
  } catch (e) {
    if (e instanceof ErroApi && e.status === 401) erro.value = 'Senha incorreta.'
    else if (e instanceof TypeError) erro.value = 'Sem conexão. Para entrar com a senha, conecte-se à internet.'
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}

async function sair() {
  // O App destrava e leva ao login; o app fica escondido até a tela de login abrir.
  await sessao.sair()
  await router.replace({ name: 'entrar' })
}
</script>

<template>
  <div class="bloqueio" role="dialog" aria-modal="true" aria-label="App bloqueado">
    <TelaAcesso
      titulo="Contadinho"
      :subtitulo="trava.pedirSenha ? 'Entre com a senha da sua conta.' : 'Desbloqueie para ver seus valores.'"
      com-logo
    >
      <FormularioEmpilhado v-if="trava.pedirSenha" @enviar="desbloquear">
        <CampoTexto v-model="senha" rotulo="Senha" tipo="password" autocomplete="current-password" placeholder="Sua senha" />
        <CaixaAviso :mensagem="erro" />
        <BotaoAcao tipo="submit" :desativado="!senha" :carregando="enviando" texto-carregando="Conferindo…">Desbloquear</BotaoAcao>
      </FormularioEmpilhado>
      <BotaoAcao v-else @click="trava.tentarBiometria()">Usar biometria</BotaoAcao>
      <BotaoAcao variante="secundario" @click="sair">Sair da conta</BotaoAcao>
    </TelaAcesso>
  </div>
</template>

<style scoped>
.bloqueio {
  position: fixed;
  inset: 0;
  z-index: 100;
  overflow-y: auto;
  background: var(--fundo);
  padding: calc(env(safe-area-inset-top) + 20px) 20px calc(env(safe-area-inset-bottom) + 16px);
}
</style>

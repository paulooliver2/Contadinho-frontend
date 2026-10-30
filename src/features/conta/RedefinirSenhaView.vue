<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import RegrasSenha from '@/components/RegrasSenha.vue'
import TelaAcesso from '@/components/TelaAcesso.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { regrasDaSenha } from '@/lib/senha'
import { useSessao } from '@/stores/sessao'
import { redefinirSenha } from './recuperacao'

const route = useRoute()
const router = useRouter()
const sessao = useSessao()

/** Vem do link do e-mail: /redefinir-senha?token=... */
const token = typeof route.query.token === 'string' ? route.query.token : ''

const senha = ref('')
const repetida = ref('')
const erro = ref(token ? '' : 'Este link está incompleto. Peça um novo.')
const linkInvalido = ref(!token)
const enviando = ref(false)

const regras = computed(() => regrasDaSenha(senha.value, repetida.value))
const pronta = computed(() => regras.value.every((r) => r.ok))

async function salvar() {
  if (!pronta.value || enviando.value) return
  erro.value = ''
  enviando.value = true
  try {
    await redefinirSenha(token, senha.value)
    // O servidor encerrou todas as sessões; este aparelho também esquece a dele.
    await sessao.encerrar()
    await router.replace({ name: 'entrar', query: { senha: 'redefinida' } })
  } catch (e) {
    const campos = e instanceof ErroApi ? e.campos : {}
    erro.value = campos.novaSenha ?? campos.token ?? mensagemDeErro(e)
    linkInvalido.value = e instanceof ErroApi && e.status === 400 && !campos.novaSenha
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaAcesso
    titulo="Criar senha nova"
    subtitulo="Use pelo menos 10 caracteres, com letras e números."
    :rodape="{ pergunta: 'Lembrou a senha?', link: 'Entrar', para: { name: 'entrar' } }"
  >
    <template v-if="linkInvalido">
      <CaixaAviso :mensagem="erro" />
      <BotaoAcao :para="{ name: 'recuperar-senha' }">Pedir um link novo</BotaoAcao>
    </template>

    <FormularioEmpilhado v-else @enviar="salvar">
      <CampoTexto v-model="senha" rotulo="Senha nova" tipo="password" autocomplete="new-password" placeholder="Pelo menos 10 caracteres" />
      <CampoTexto v-model="repetida" rotulo="Repita a senha nova" tipo="password" autocomplete="new-password" placeholder="Igual à de cima" />

      <RegrasSenha :regras="regras" />
      <TextoAjuda>Ao salvar, todas as sessões abertas são encerradas e você entra de novo com a senha nova.</TextoAjuda>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :desativado="!pronta" :carregando="enviando" texto-carregando="Salvando…">
        Salvar senha nova
      </BotaoAcao>
    </FormularioEmpilhado>
  </TelaAcesso>
</template>

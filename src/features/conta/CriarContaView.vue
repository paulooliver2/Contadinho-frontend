<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import RegrasSenha from '@/components/RegrasSenha.vue'
import TelaAcesso from '@/components/TelaAcesso.vue'
import { regrasDaSenha } from '@/lib/senha'
import { useSessao } from '@/stores/sessao'

const router = useRouter()
const sessao = useSessao()

const nome = ref('')
const email = ref('')
const senha = ref('')
const repetida = ref('')
const erro = ref('')
const errosDosCampos = ref<Record<string, string>>({})
const enviando = ref(false)

const regras = computed(() => regrasDaSenha(senha.value, repetida.value))
const emailParece = computed(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()))
const pronto = computed(() => nome.value.trim() !== '' && emailParece.value && regras.value.every((r) => r.ok))

async function criar() {
  if (!pronto.value || enviando.value) return
  erro.value = ''
  errosDosCampos.value = {}
  enviando.value = true
  try {
    await sessao.cadastrar(nome.value, email.value, senha.value)
    await router.replace('/')
  } catch (e) {
    if (e instanceof ErroApi && e.status === 409) {
      errosDosCampos.value = { email: e.message }
    } else if (e instanceof ErroApi && Object.keys(e.campos).length > 0) {
      errosDosCampos.value = e.campos
    } else {
      erro.value = mensagemDeErro(e)
    }
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaAcesso
    titulo="Criar conta"
    subtitulo="Só você usa o app. Quem te deve não precisa de conta."
    :voltar="{ para: { name: 'entrar' }, rotulo: 'Voltar para o login' }"
    :rodape="{ pergunta: 'Já tem conta?', link: 'Entrar', para: { name: 'entrar' } }"
  >
    <FormularioEmpilhado @enviar="criar">
      <CampoTexto v-model="nome" rotulo="Como quer ser chamado" autocomplete="given-name" placeholder="Ex.: Paulo" :erro="errosDosCampos.nome" />
      <CampoTexto v-model="email" rotulo="E-mail" tipo="email" autocomplete="email" placeholder="voce@email.com" :erro="errosDosCampos.email" />
      <CampoTexto v-model="senha" rotulo="Senha" tipo="password" autocomplete="new-password" placeholder="Pelo menos 10 caracteres" :erro="errosDosCampos.senha" />
      <CampoTexto v-model="repetida" rotulo="Repita a senha" tipo="password" autocomplete="new-password" placeholder="Igual à de cima" />

      <RegrasSenha :regras="regras" />

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :desativado="!pronto" :carregando="enviando" texto-carregando="Criando…">
        Criar conta
      </BotaoAcao>
    </FormularioEmpilhado>
  </TelaAcesso>
</template>

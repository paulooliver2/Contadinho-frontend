<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import ExplicacaoAvisosFolha from '@/features/avisos/ExplicacaoAvisosFolha.vue'
import { aoTocar } from '@/lib/notificacoes'
import { useAvisos } from '@/stores/avisos'
import { useSessao } from '@/stores/sessao'

const route = useRoute()
const router = useRouter()
const sessao = useSessao()
const comAbas = computed(() => route.meta.abas === true)
// Cria o store já na abertura: é ele que reagenda os avisos quando a sessão começa (HU-29.2).
useAvisos()

// O aviso abre o que pede ação: a conta com "Marcar como paga" (HU-26.3), a fatura para importar ou quem cobrar (HU-27).
aoTocar(({ tela, id, mes }) => {
  if (tela === 'CONTA' && id && mes) router.push({ name: 'gastos', query: { conta: id, mes } })
  else if (tela === 'FATURA' && id && mes) router.push({ name: 'cartoes', query: { cartao: id, fatura: mes } })
  else if (tela === 'PESSOA' && id) router.push({ name: 'pessoa', params: { id } })
  else if (tela === 'RECEBER') router.push({ name: 'receber' })
})

// Sessão encerrada no meio do uso (refresh vencido ou revogado): volta para o login (HU-01.4).
watch(
  () => sessao.logado,
  (logado) => {
    if (!logado && !route.meta.acesso) router.replace({ name: 'entrar' })
  },
)
</script>

<template>
  <div class="app">
    <main class="conteudo">
      <RouterView />
    </main>
    <TabBar v-if="comAbas" />
    <ExplicacaoAvisosFolha />
  </div>
</template>

<style scoped>
.app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.conteudo {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: calc(env(safe-area-inset-top) + 20px) 20px 16px;
}
</style>

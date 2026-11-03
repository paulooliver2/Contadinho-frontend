<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import ExplicacaoAvisosFolha from '@/features/avisos/ExplicacaoAvisosFolha.vue'
import OfertaBiometriaFolha from '@/features/conta/OfertaBiometriaFolha.vue'
import TelaBloqueio from '@/features/conta/TelaBloqueio.vue'
import { aoTocar } from '@/lib/notificacoes'
import { useAvisos } from '@/stores/avisos'
import { useSessao } from '@/stores/sessao'
import { useTrava } from '@/stores/trava'

const route = useRoute()
const router = useRouter()
const sessao = useSessao()
const trava = useTrava()
const comAbas = computed(() => route.meta.abas === true)
/**
 * HU-02: bloqueado, em segundo plano ou com a sessão encerrada numa tela da conta (até chegar no login), o app some
 * da tela e do leitor de tela, mas o estado das telas continua.
 */
const escondido = computed(() => trava.bloqueado || trava.coberto || (!sessao.logado && !route.meta.acesso))
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
    if (logado) return
    trava.esquecer()
    if (!route.meta.acesso) router.replace({ name: 'entrar' })
  },
)
</script>

<template>
  <TelaBloqueio v-if="trava.bloqueado" />
  <div v-show="!escondido" class="app" :inert="escondido">
    <main class="conteudo">
      <RouterView />
    </main>
    <TabBar v-if="comAbas" />
    <ExplicacaoAvisosFolha />
    <OfertaBiometriaFolha />
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

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TabBar from '@/components/TabBar.vue'
import { useSessao } from '@/stores/sessao'

const route = useRoute()
const router = useRouter()
const sessao = useSessao()
const comAbas = computed(() => route.meta.abas === true)

// Sessão encerrada no meio do uso (refresh vencido ou revogado): volta para o login (HU-01.4).
watch(
  () => sessao.logado,
  (logado) => {
    if (!logado && !route.meta.publica) router.replace({ name: 'entrar' })
  },
)
</script>

<template>
  <div class="app">
    <main class="conteudo">
      <RouterView />
    </main>
    <TabBar v-if="comAbas" />
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

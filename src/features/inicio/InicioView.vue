<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api/client'
import BotaoAcao from '@/components/BotaoAcao.vue'
import EmConstrucao from '@/components/EmConstrucao.vue'
import { useSessao } from '@/stores/sessao'

const router = useRouter()
const sessao = useSessao()
const nome = ref('')

onMounted(async () => {
  const { data } = await api.GET('/api/conta')
  if (data) nome.value = data.nome
})

// Provisório: o "Sair" definitivo fica em Configurações.
async function sair() {
  await sessao.sair()
  await router.replace({ name: 'entrar' })
}
</script>

<template>
  <p v-if="nome" class="ola">Olá, {{ nome }}</p>
  <EmConstrucao titulo="Início" hus="HU-23 e HU-24" />
  <BotaoAcao variante="secundario" class="sair" @click="sair">Sair</BotaoAcao>
</template>

<style scoped>
.ola {
  margin: 0 0 8px;
  font-size: 14px;
  color: var(--texto-suave);
}

.sair {
  margin-top: 16px;
}
</style>

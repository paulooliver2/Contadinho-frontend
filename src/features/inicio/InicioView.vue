<script setup lang="ts">
import { onMounted } from 'vue'
import BotaoAcao from '@/components/BotaoAcao.vue'
import EmConstrucao from '@/components/EmConstrucao.vue'
import { useConta } from '@/stores/conta'

const conta = useConta()

onMounted(() => conta.carregar().catch(() => {}))
</script>

<template>
  <header class="topo">
    <p v-if="conta.conta" class="ola">Olá, {{ conta.conta.nome }}</p>
    <RouterLink :to="{ name: 'configuracoes' }" class="configuracoes" aria-label="Configurações">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    </RouterLink>
  </header>
  <BotaoAcao variante="secundario" :para="{ name: 'receitas' }">Receitas do mês</BotaoAcao>
  <EmConstrucao titulo="Início" hus="HU-23 e HU-24" />
</template>

<style scoped>
.topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ola {
  margin: 0;
  font-size: 14px;
  color: var(--texto-suave);
}

.configuracoes {
  width: var(--toque-minimo);
  height: var(--toque-minimo);
  margin: 0 -12px 0 auto;
  color: var(--texto);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

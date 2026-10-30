<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import BotaoVoltar from './BotaoVoltar.vue'
import LogoContadinho from './LogoContadinho.vue'

/** Molde das telas de quem ainda não entrou: login, cadastro, recuperar senha. */
defineProps<{
  titulo: string
  subtitulo: string
  comLogo?: boolean
  voltar?: { para: RouteLocationRaw; rotulo: string }
  /** Convite no pé da tela, como "Ainda não tem conta? Criar conta". */
  rodape?: { pergunta: string; link: string; para: RouteLocationRaw }
}>()
</script>

<template>
  <section class="tela" :class="{ 'com-logo': comLogo }">
    <BotaoVoltar v-if="voltar" :para="voltar.para" :rotulo="voltar.rotulo" />

    <header class="cabecalho">
      <LogoContadinho v-if="comLogo" />
      <div class="titulos">
        <h1>{{ titulo }}</h1>
        <p>{{ subtitulo }}</p>
      </div>
    </header>

    <slot />

    <p v-if="rodape" class="rodape">
      <span>{{ rodape.pergunta }}</span>
      <RouterLink :to="rodape.para">{{ rodape.link }}</RouterLink>
    </p>
  </section>
</template>

<style scoped>
.tela {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 0 4px 16px;
}

.tela.com-logo {
  gap: 28px;
  padding-top: 52px;
}

.cabecalho {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.titulos {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.titulos p {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: var(--texto-suave);
}

.rodape {
  margin: auto 0 0;
  display: flex;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
}

.rodape span {
  color: var(--texto-suave);
}

.rodape a {
  font-weight: 600;
  text-decoration: none;
}
</style>

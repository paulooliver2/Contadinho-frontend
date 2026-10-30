<script setup lang="ts">
import BotaoAcao from '@/components/BotaoAcao.vue'
import EmConstrucao from '@/components/EmConstrucao.vue'
</script>

<template>
  <EmConstrucao titulo="Recuperar senha" hus="HU-40" />
  <BotaoAcao variante="secundario" :para="{ name: 'entrar' }" class="voltar">Voltar para o login</BotaoAcao>
</template>

<style scoped>
.voltar {
  margin-top: 16px;
}
</style>

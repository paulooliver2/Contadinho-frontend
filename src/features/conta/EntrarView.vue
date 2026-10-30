<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import EmConstrucao from '@/components/EmConstrucao.vue'
import { useSessao } from '@/stores/sessao'

const dev = import.meta.env.DEV
const route = useRoute()
const router = useRouter()

// Só em desenvolvimento, até o login (HU-01) existir: libera as abas para navegar pela estrutura.
function entrarSemConta() {
  useSessao().entrar('dev')
  router.replace(typeof route.query.voltar === 'string' ? route.query.voltar : '/')
}
</script>

<template>
  <EmConstrucao titulo="Entrar no Contadinho" hus="HU-01, HU-02 e HU-40" />
  <button v-if="dev" type="button" class="dev" @click="entrarSemConta">Entrar sem conta (desenvolvimento)</button>
</template>

<style scoped>
.dev {
  margin-top: 16px;
  width: 100%;
  min-height: var(--toque-minimo);
  border-radius: 14px;
  border: 1px dashed var(--borda);
  background: var(--superficie);
  color: var(--texto);
  font-weight: 600;
  cursor: pointer;
}
</style>

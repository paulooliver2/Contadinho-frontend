<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from '@/components/TabBar.vue'

const route = useRoute()
const comAbas = computed(() => route.meta.abas === true)
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

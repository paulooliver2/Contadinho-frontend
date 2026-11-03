<script setup lang="ts">
import { useRoute } from 'vue-router'

// Abas do app; a Carteira (HU-30) é a quinta.
const abas = [
  { nome: 'inicio', rotulo: 'Início', icone: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { nome: 'gastos', rotulo: 'Gastos', icone: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3' },
  { nome: 'cartoes', rotulo: 'Cartões', icone: 'M4.5 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM2.5 10h19' },
  { nome: 'receber', rotulo: 'A receber', icone: 'M4 8h15l-3-3M20 16H5l3 3' },
  { nome: 'carteira', rotulo: 'Carteira', icone: 'M4 4v16h16M8 15l3.5-4 3 2.5L20 7' },
] as const

const rota = useRoute()
</script>

<template>
  <nav class="abas" aria-label="Navegação principal">
    <RouterLink
      v-for="aba in abas"
      :key="aba.nome"
      :to="{ name: aba.nome }"
      class="aba"
      :class="{ ativa: rota.name === aba.nome || rota.meta.aba === aba.nome }"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path :d="aba.icone" />
      </svg>
      {{ aba.rotulo }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.abas {
  flex: none;
  display: flex;
  background: var(--superficie);
  border-top: 1px solid #E1E6E3;
  padding: 6px 4px calc(env(safe-area-inset-bottom) + 10px);
}

.aba {
  flex: 1;
  min-height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-decoration: none;
  color: var(--texto-suave);
  font-size: 11px;
}

.aba.ativa {
  color: var(--marca);
  font-weight: 600;
}
</style>

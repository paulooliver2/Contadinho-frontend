<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

/** Botão grande das telas. Com `para`, vira um link de navegação com a mesma cara. */
withDefaults(
  defineProps<{
    variante?: 'principal' | 'secundario'
    tipo?: 'button' | 'submit'
    desativado?: boolean
    /** Enquanto true, mostra `textoCarregando` e não aceita outro toque. */
    carregando?: boolean
    textoCarregando?: string
    para?: RouteLocationRaw
  }>(),
  { variante: 'principal', tipo: 'button' },
)
</script>

<template>
  <RouterLink v-if="para" :to="para" class="botao" :class="variante">
    <slot />
  </RouterLink>
  <button v-else :type="tipo" class="botao" :class="variante" :disabled="desativado || carregando" :aria-busy="carregando || undefined">
    <template v-if="carregando && textoCarregando">{{ textoCarregando }}</template>
    <slot v-else />
  </button>
</template>

<style scoped>
.botao {
  width: 100%;
  min-height: 52px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
}

.principal {
  border: none;
  background: var(--marca);
  color: #FFFFFF;
}

.principal:disabled {
  background: #C3CBC7;
  color: var(--rotulo);
  cursor: default;
}

.secundario {
  border: 1px solid var(--borda);
  background: var(--superficie);
  color: var(--texto);
}

.secundario:disabled {
  border-style: dashed;
  background: transparent;
  color: var(--texto-suave);
  cursor: default;
}
</style>

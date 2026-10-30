<script setup lang="ts">
import type { RegraSenha } from '@/lib/senha'

defineProps<{ regras: RegraSenha[] }>()
</script>

<template>
  <ul class="regras" aria-label="Regras da senha">
    <li v-for="regra in regras" :key="regra.texto" :class="{ ok: regra.ok }">
      <span class="marca" aria-hidden="true">{{ regra.ok ? '✓' : '' }}</span>
      {{ regra.texto }}
      <span class="so-leitor">{{ regra.ok ? '(atendida)' : '(pendente)' }}</span>
    </li>
  </ul>
</template>

<style scoped>
.regras {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--texto-suave);
}

li.ok {
  color: var(--marca-escura);
}

.marca {
  width: 18px;
  height: 18px;
  border-radius: 9px;
  border: 1.5px solid #9AA8A1;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ok .marca {
  border: none;
  background: var(--marca);
  color: #FFFFFF;
}

.so-leitor {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
</style>

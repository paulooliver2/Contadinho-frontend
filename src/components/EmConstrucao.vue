<script setup lang="ts">
defineProps<{ titulo: string; hus: string }>()
</script>

<template>
  <section class="tela">
    <h1>{{ titulo }}</h1>
    <p class="aviso">Ainda não implementada. Cobre {{ hus }}; o desenho está no protótipo em <code>docs/</code>.</p>
  </section>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.aviso {
  margin: 0;
  background: var(--info-claro);
  color: var(--info);
  border-radius: var(--raio-campo);
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.45;
}
</style>

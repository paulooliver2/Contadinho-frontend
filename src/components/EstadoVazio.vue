<script setup lang="ts">
/** Quando ainda não há nada para mostrar: ícone, o que falta e, se houver, o botão do próximo passo. */
defineProps<{ titulo: string; texto: string }>()
</script>

<template>
  <div class="vazio">
    <slot name="icone" />
    <p class="titulo">{{ titulo }}</p>
    <p class="texto">{{ texto }}</p>
    <slot name="acao" />
  </div>
</template>

<style scoped>
.vazio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  border-radius: var(--raio-card);
  background: var(--superficie);
  text-align: center;
  color: var(--texto-suave);
}

.titulo {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--texto);
}

.texto {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
}
</style>

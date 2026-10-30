<script setup lang="ts">
/** Texto pequeno de orientação. O tom só muda a cor: aviso (amarelo), informação (azul), sucesso (verde). */
withDefaults(defineProps<{ tom?: 'neutro' | 'aviso' | 'info' | 'sucesso' }>(), { tom: 'neutro' })
</script>

<template>
  <p class="ajuda" :class="tom"><slot /></p>
</template>

<style scoped>
.ajuda {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--texto-suave);
}

.aviso {
  color: var(--aviso);
}

.info {
  color: var(--info);
}

.sucesso {
  color: var(--marca-escura);
}
</style>

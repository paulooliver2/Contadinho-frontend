<script setup lang="ts">
/**
 * Aviso em caixa colorida. Erro é anunciado na hora pelo leitor de tela (alert); sucesso, sem interromper (status).
 * Use `mensagem` para texto simples ou o slot para texto com destaque.
 */
withDefaults(defineProps<{ mensagem?: string; tom?: 'erro' | 'sucesso' }>(), { tom: 'erro' })
</script>

<template>
  <div v-if="mensagem || $slots.default" class="aviso" :class="tom" :role="tom === 'erro' ? 'alert' : 'status'">
    <slot name="icone" />
    <p><slot>{{ mensagem }}</slot></p>
  </div>
</template>

<style scoped>
.aviso {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: var(--raio-campo);
}

.aviso p {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
}

.erro {
  background: var(--alerta-claro);
  color: var(--alerta);
}

.sucesso {
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--marca-clara);
  color: var(--marca-escura);
}

.aviso :deep(svg) {
  flex: none;
}
</style>

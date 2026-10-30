<script setup lang="ts">
/**
 * Aviso em caixa colorida. Erro é anunciado na hora pelo leitor de tela (alert); sucesso, sem interromper (status).
 * Use `mensagem` para texto simples ou o slot para texto com destaque. Com `fechavel`, mostra o X e emite `fechar`.
 */
withDefaults(defineProps<{ mensagem?: string; tom?: 'erro' | 'sucesso'; fechavel?: boolean }>(), { tom: 'erro' })
const emit = defineEmits<{ fechar: [] }>()
</script>

<template>
  <div v-if="mensagem || $slots.default" class="aviso" :class="tom" :role="tom === 'erro' ? 'alert' : 'status'">
    <slot name="icone" />
    <p><slot>{{ mensagem }}</slot></p>
    <button v-if="fechavel" type="button" class="fechar" aria-label="Fechar aviso" @click="emit('fechar')">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
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
  flex: 1;
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

.fechar {
  flex: none;
  width: 32px;
  height: 32px;
  margin: -6px -6px -6px 0;
  border: none;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>

<script setup lang="ts">
import { STATUS, type Situacao } from './receber'

/** Status do saldo da pessoa (RN-29). A cor só reforça: o texto sempre diz o status. */
defineProps<{ status: Situacao['status'] }>()
</script>

<template>
  <span class="selo" :class="status.toLowerCase()">{{ STATUS[status] }}</span>
</template>

<style scoped>
.selo {
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.pendente {
  background: var(--aviso-claro);
  color: var(--aviso);
}

.pagou_parte {
  background: var(--info-claro);
  color: var(--info);
}

.pago {
  background: var(--marca-clara);
  color: var(--marca-escura);
}
</style>

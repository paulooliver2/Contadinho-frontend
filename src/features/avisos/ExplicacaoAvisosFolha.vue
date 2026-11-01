<script setup lang="ts">
import { computed, ref } from 'vue'
import BotaoAcao from '@/components/BotaoAcao.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import { useAvisos } from '@/stores/avisos'

/**
 * HU-25.1: antes do pedido do sistema, diz que aviso vem e por quê. Aparece uma vez, depois da primeira conta fixa
 * ou do primeiro cartão; fechar conta como "agora não".
 */
const avisos = useAvisos()
const pedindo = ref(false)

const aberta = computed({
  get: () => avisos.explicando,
  set: (valor) => {
    if (!valor) avisos.explicado()
  },
})

async function permitir() {
  pedindo.value = true
  try {
    await avisos.permitir()
  } finally {
    pedindo.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" titulo="Avisar antes de vencer?">
    <p class="texto">
      O Contadinho te avisa <strong>2 dias antes</strong> e <strong>no dia</strong> do vencimento de cada conta fixa, às 9h,
      para você não pagar juros. Tocar no aviso abre a conta para marcar como paga.
    </p>
    <p class="texto suave">Os avisos ficam agendados no seu celular. Em seguida, ele vai pedir a sua permissão.</p>
    <BotaoAcao :carregando="pedindo" texto-carregando="Pedindo…" @click="permitir">Permitir avisos</BotaoAcao>
    <BotaoAcao variante="secundario" :desativado="pedindo" @click="aberta = false">Agora não</BotaoAcao>
  </FolhaInferior>
</template>

<style scoped>
.texto {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
}

.suave {
  font-size: 13px;
  color: var(--texto-suave);
}
</style>

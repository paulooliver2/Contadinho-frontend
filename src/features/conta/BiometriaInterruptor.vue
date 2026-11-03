<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Interruptor from '@/components/Interruptor.vue'
import { nomeComArtigo } from '@/lib/biometria'
import { useConta } from '@/stores/conta'
import { useTrava } from '@/stores/trava'

/**
 * HU-02: a seção "Segurança" de Configurações. Só aparece quando o aparelho tem biometria; ligar pede a biometria
 * uma vez para confirmar.
 */
const trava = useTrava()
const conta = useConta()
const ocupado = ref(false)

onMounted(() => trava.atualizarAparelho().catch(() => undefined))

const ligada = computed({
  get: () => trava.ligada,
  set: async (ligar: boolean) => {
    if (ocupado.value) return
    ocupado.value = true
    try {
      if (ligar) await trava.ligar(conta.conta?.email ?? '')
      else await trava.desligar()
    } finally {
      ocupado.value = false
    }
  },
})
</script>

<template>
  <template v-if="trava.disponivel">
    <h2>Segurança</h2>
    <section class="cartao" aria-labelledby="titulo-seguranca">
      <h3 id="titulo-seguranca" class="oculto">Desbloqueio</h3>
      <Interruptor
        v-model="ligada"
        rotulo="Desbloquear com biometria"
        :descricao="`Pede ${nomeComArtigo(trava.tipo)} ao abrir o app e depois de 5 minutos fora dele.`"
      />
    </section>
  </template>
</template>

<style scoped>
h2 {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rotulo);
}

.cartao {
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--superficie);
}

.oculto {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>

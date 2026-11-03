<script setup lang="ts">
import { computed, ref } from 'vue'
import BotaoAcao from '@/components/BotaoAcao.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import { nomeComArtigo, nomeCurto } from '@/lib/biometria'
import { useTrava } from '@/stores/trava'

/** HU-02: logo depois do login com senha (ou do cadastro), oferece desbloquear com a biometria do aparelho. */
const trava = useTrava()
const ligando = ref(false)

const aberta = computed({
  get: () => trava.oferta,
  // Fechar sem escolher não grava nada: a oferta volta no próximo login.
  set: (v: boolean) => {
    trava.oferta = v
  },
})

async function usar() {
  if (ligando.value) return
  ligando.value = true
  try {
    await trava.ligar()
  } finally {
    ligando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="`Usar ${nomeComArtigo(trava.tipo)} para desbloquear?`">
    <div class="oferta">
      <p>Você entra sem digitar a senha e ninguém vê seus valores se pegar o celular. Dá para mudar depois em Configurações.</p>
      <BotaoAcao :carregando="ligando" @click="usar">Usar {{ nomeCurto(trava.tipo) }}</BotaoAcao>
      <BotaoAcao variante="secundario" :desativado="ligando" @click="trava.recusar()">Agora não</BotaoAcao>
    </div>
  </FolhaInferior>
</template>

<style scoped>
.oferta {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

p {
  margin: 0;
  font-size: 14px;
  color: var(--texto-suave);
  line-height: 1.45;
}
</style>

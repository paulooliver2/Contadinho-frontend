import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Token de acesso só em memória (15 min, HU-01). O refresh token vai para o armazenamento
 * seguro do aparelho (Keystore no Android) quando o login for implementado — nunca para o localStorage.
 */
export const useSessao = defineStore('sessao', () => {
  const tokenAcesso = ref<string | null>(null)
  const logado = computed(() => tokenAcesso.value !== null)

  function entrar(token: string) {
    tokenAcesso.value = token
  }

  function sair() {
    tokenAcesso.value = null
  }

  return { tokenAcesso, logado, entrar, sair }
})

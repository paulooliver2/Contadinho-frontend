import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiAberta } from '@/api/aberta'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'
import { cofre } from '@/lib/cofre'

type Tokens = components['schemas']['Tokens']

/** Renova o token de acesso quando faltar menos que isso para vencer. */
const MARGEM_MS = 60_000

/**
 * Sessão da HU-01. O token de acesso (15 min) fica só em memória; o refresh token (30 dias) fica no cofre
 * do aparelho e é trocado a cada renovação. Refresh vencido ou revogado leva de volta ao login (HU-01.4).
 */
export const useSessao = defineStore('sessao', () => {
  const tokenAcesso = ref<string | null>(null)
  const logado = computed(() => tokenAcesso.value !== null)

  /** Pelo relógio do aparelho: vale a duração do token, contada de quando ele chegou. */
  let venceEm = 0
  let renovacao: Promise<boolean> | null = null
  let restauracao: Promise<void> | null = null

  async function guardar(tokens: Tokens) {
    await cofre.guardarRefresh(tokens.refreshToken)
    tokenAcesso.value = tokens.tokenAcesso
    venceEm = Date.now() + duracaoMs(tokens.tokenAcesso)
  }

  async function entrar(email: string, senha: string) {
    const { data, error, response } = await apiAberta.POST('/api/auth/entrar', { body: { email, senha } })
    if (!data) throw erroDaApi(error, response)
    await guardar(data)
  }

  async function cadastrar(nome: string, email: string, senha: string) {
    const { data, error, response } = await apiAberta.POST('/api/auth/cadastro', { body: { nome, email, senha } })
    if (!data) throw erroDaApi(error, response)
    await guardar(data)
  }

  /** Uma renovação por vez: o refresh token só vale uma vez, então chamadas em paralelo esperam a mesma. */
  function renovar(): Promise<boolean> {
    renovacao ??= (async () => {
      const refreshToken = await cofre.lerRefresh()
      if (!refreshToken) return false
      try {
        const { data, response } = await apiAberta.POST('/api/auth/renovar', { body: { refreshToken } })
        if (data) {
          await guardar(data)
          return true
        }
        if (response.status === 401) await encerrar()
        return false
      } catch {
        // Sem rede: guarda o refresh para tentar de novo depois.
        return false
      }
    })().finally(() => {
      renovacao = null
    })
    return renovacao
  }

  async function tokenValido(): Promise<string | null> {
    if (tokenAcesso.value && Date.now() < venceEm - MARGEM_MS) return tokenAcesso.value
    return (await renovar()) ? tokenAcesso.value : null
  }

  /** Ao abrir o app, entra com o refresh token guardado, se houver. Roda uma vez só. */
  function restaurar(): Promise<void> {
    restauracao ??= renovar().then(() => undefined)
    return restauracao
  }

  /** Esquece a sessão neste aparelho, sem falar com o servidor. */
  async function encerrar() {
    tokenAcesso.value = null
    venceEm = 0
    await cofre.apagarRefresh()
  }

  async function sair() {
    const refreshToken = await cofre.lerRefresh()
    await encerrar()
    // HU-02: a escolha da biometria e o e-mail são deste dono neste aparelho.
    await cofre.apagarBiometria()
    if (refreshToken) {
      // Revoga no servidor; se não houver rede, a sessão vence sozinha em 30 dias.
      apiAberta.POST('/api/auth/sair', { body: { refreshToken } }).catch(() => undefined)
    }
  }

  return { tokenAcesso, logado, entrar, cadastrar, tokenValido, restaurar, encerrar, sair }
})

/** exp - iat do JWT. Não depende do relógio do aparelho bater com o do servidor. */
function duracaoMs(jwt: string): number {
  try {
    const base64 = jwt.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const { exp, iat } = JSON.parse(atob(base64)) as { exp: number; iat: number }
    return (exp - iat) * 1000
  } catch {
    return MARGEM_MS
  }
}

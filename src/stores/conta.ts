import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'
import { useSessao } from './sessao'

export type Conta = components['schemas']['Conta']
export type Pix = components['schemas']['Pix']
export type TipoPix = Pix['tipo']

/** O dono logado: nome, e-mail e a chave Pix que vai nas cobranças (HU-03). */
export const useConta = defineStore('conta', () => {
  const conta = ref<Conta | null>(null)

  async function carregar(): Promise<Conta> {
    const { data, error, response } = await api.GET('/api/conta')
    if (!data) throw erroDaApi(error, response)
    conta.value = data
    return data
  }

  /** HU-03.1: o servidor valida pelo formato do tipo e devolve a chave como ficou guardada. */
  async function salvarPix(tipo: TipoPix, chave: string): Promise<Pix> {
    const { data, error, response } = await api.PUT('/api/conta/pix', { body: { tipo, chave } })
    if (!data) throw erroDaApi(error, response)
    if (conta.value) conta.value = { ...conta.value, pix: data }
    return data
  }

  async function removerPix() {
    const { error, response } = await api.DELETE('/api/conta/pix')
    if (!response.ok) throw erroDaApi(error, response)
    if (conta.value) conta.value = { ...conta.value, pix: undefined }
  }

  // Outro dono pode entrar neste aparelho: nada do anterior fica na memória.
  const sessao = useSessao()
  watch(
    () => sessao.logado,
    (logado) => {
      if (!logado) conta.value = null
    },
  )

  return { conta, carregar, salvarPix, removerPix }
})

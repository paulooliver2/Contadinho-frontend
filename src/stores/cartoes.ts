import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'
import { useSessao } from './sessao'

export type Cartao = components['schemas']['CartaoResposta']
export type Banco = components['schemas']['BancoResposta']
export type NovoCartao = components['schemas']['NovoCartaoPedido']

/** Cartões ativos do dono e a lista de bancos (HU-05). Usada na aba Cartões e, depois, na importação. */
export const useCartoes = defineStore('cartoes', () => {
  const lista = ref<Cartao[]>([])
  const bancos = ref<Banco[]>([])
  const carregado = ref(false)

  async function carregar() {
    const [cartoes, listaBancos] = await Promise.all([api.GET('/api/cartoes'), api.GET('/api/cartoes/bancos')])
    if (!cartoes.data) throw erroDaApi(cartoes.error, cartoes.response)
    if (!listaBancos.data) throw erroDaApi(listaBancos.error, listaBancos.response)
    lista.value = cartoes.data
    bancos.value = listaBancos.data
    carregado.value = true
  }

  async function cadastrar(novo: NovoCartao): Promise<Cartao> {
    const { data, error, response } = await api.POST('/api/cartoes', { body: novo })
    if (!data) throw erroDaApi(error, response)
    lista.value.push(data)
    return data
  }

  // Outro dono pode entrar neste aparelho: nada do anterior fica na memória.
  const sessao = useSessao()
  watch(
    () => sessao.logado,
    (logado) => {
      if (logado) return
      lista.value = []
      carregado.value = false
    },
  )

  return { lista, bancos, carregado, carregar, cadastrar }
})

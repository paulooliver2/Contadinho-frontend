import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'
import { useSessao } from './sessao'

export type Cartao = components['schemas']['CartaoResposta']
export type Banco = components['schemas']['BancoResposta']
export type NovoCartao = components['schemas']['NovoCartaoPedido']
export type EdicaoCartao = components['schemas']['EdicaoCartaoPedido']

/** Cartões ativos do dono e a lista de bancos (HU-05), com edição, encerramento e exclusão (HU-45). */
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

  async function alterar(id: string, edicao: EdicaoCartao): Promise<Cartao> {
    const { data, error, response } = await api.PUT('/api/cartoes/{id}', { params: { path: { id } }, body: edicao })
    if (!data) throw erroDaApi(error, response)
    lista.value = lista.value.map((c) => (c.id === id ? data : c))
    return data
  }

  /** HU-45.3: some da lista; as faturas dele continuam nos totais e no A receber. */
  async function encerrar(id: string) {
    const { error, response } = await api.POST('/api/cartoes/{id}/encerramento', { params: { path: { id } } })
    if (!response.ok) throw erroDaApi(error, response)
    lista.value = lista.value.filter((c) => c.id !== id)
  }

  /** HU-45.2: só sem histórico (podeExcluir). */
  async function excluir(id: string) {
    const { error, response } = await api.DELETE('/api/cartoes/{id}', { params: { path: { id } } })
    if (!response.ok) throw erroDaApi(error, response)
    lista.value = lista.value.filter((c) => c.id !== id)
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

  return { lista, bancos, carregado, carregar, cadastrar, alterar, encerrar, excluir }
})

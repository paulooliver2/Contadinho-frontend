import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'

export type Fatura = components['schemas']['FaturaResposta']
export type Lancamento = components['schemas']['LancamentoResposta']
export type Compra = components['schemas']['CompraPedido']

/** A fatura de um mês de vencimento (RN-58). Sem compras, vem vazia com as datas calculadas. */
export async function buscarFatura(cartaoId: string, mes: string): Promise<Fatura> {
  const { data, error, response } = await api.GET('/api/cartoes/{cartaoId}/faturas/{mes}', {
    params: { path: { cartaoId, mes } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-47: compra digitada na fatura do mês. */
export async function adicionarCompra(cartaoId: string, mes: string, compra: Compra): Promise<Lancamento> {
  const { data, error, response } = await api.POST('/api/cartoes/{cartaoId}/faturas/{mes}/lancamentos', {
    params: { path: { cartaoId, mes } },
    body: compra,
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** RN-60: só compras digitadas. */
export async function corrigirCompra(id: string, compra: Compra): Promise<Lancamento> {
  const { data, error, response } = await api.PUT('/api/lancamentos/{id}', { params: { path: { id } }, body: compra })
  if (!data) throw erroDaApi(error, response)
  return data
}

export async function excluirCompra(id: string): Promise<void> {
  const { error, response } = await api.DELETE('/api/lancamentos/{id}', { params: { path: { id } } })
  if (!response.ok) throw erroDaApi(error, response)
}

import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'

export type Adicionais = components['schemas']['AdicionaisResposta']
export type Adicional = components['schemas']['AdicionalResposta']

/** HU-38: os adicionais do cartão e se os arquivos dele trazem o final de cada compra. */
export async function buscarAdicionais(cartaoId: string): Promise<Adicionais> {
  const { data, error, response } = await api.GET('/api/cartoes/{cartaoId}/adicionais', {
    params: { path: { cartaoId } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

export async function cadastrarAdicional(cartaoId: string, ultimos4: string, pessoaId: string): Promise<Adicional> {
  const { data, error, response } = await api.POST('/api/cartoes/{cartaoId}/adicionais', {
    params: { path: { cartaoId } },
    body: { ultimos4, pessoaId },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

export async function removerAdicional(cartaoId: string, id: string): Promise<void> {
  const { error, response } = await api.DELETE('/api/cartoes/{cartaoId}/adicionais/{id}', {
    params: { path: { cartaoId, id } },
  })
  if (!response.ok) throw erroDaApi(error, response)
}

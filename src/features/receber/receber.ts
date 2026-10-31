import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'

export type Resumo = components['schemas']['ResumoResposta']
export type Situacao = components['schemas']['SituacaoResposta']
export type Historico = components['schemas']['HistoricoResposta']
export type CompraAtribuida = components['schemas']['CompraResposta']

/** HU-18: total a receber, já recebido e a situação de quem tem algo registrado, pelo vencimento mais próximo. */
export async function buscarResumo(): Promise<Resumo> {
  const { data, error, response } = await api.GET('/api/receber')
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-18.3: a situação da pessoa e as compras atribuídas a ela. */
export async function buscarHistorico(pessoaId: string): Promise<Historico> {
  const { data, error, response } = await api.GET('/api/receber/pessoas/{pessoaId}', {
    params: { path: { pessoaId } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** RN-29, como se lê na tela. */
export const STATUS: Record<Situacao['status'], string> = {
  PENDENTE: 'pendente',
  PAGOU_PARTE: 'pagou parte',
  PAGO: 'pago',
}

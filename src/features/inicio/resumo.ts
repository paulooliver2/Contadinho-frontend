import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'

export type ResumoDoMes = components['schemas']['ResumoDoMesResposta']
export type FaturaDoResumo = components['schemas']['FaturaDoResumo']

/** HU-23: receitas, despesas e saldo do mês (yyyy-MM), sempre calculados pelo servidor (RN-39). */
export async function buscarResumoDoMes(mes: string): Promise<ResumoDoMes> {
  const { data, error, response } = await api.GET('/api/resumo/mes/{mes}', { params: { path: { mes } } })
  if (!data) throw erroDaApi(error, response)
  return data
}

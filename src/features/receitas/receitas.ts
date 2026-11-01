import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'

export type ReceitasDoMes = components['schemas']['ReceitasDoMesResposta']
export type ReceitaDoMes = components['schemas']['OcorrenciaReceitaResposta']
export type Receita = components['schemas']['ReceitaResposta']
export type DadosReceita = components['schemas']['ReceitaPedido']

/** HU-22: as receitas do mês (yyyy-MM), pela data, com o total recebido e o previsto. */
export async function buscarReceitasDoMes(mes: string): Promise<ReceitasDoMes> {
  const { data, error, response } = await api.GET('/api/receitas/mes/{mes}', { params: { path: { mes } } })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-22.1. A de uma vez com data até hoje já nasce recebida. */
export async function cadastrarReceita(dados: DadosReceita): Promise<Receita> {
  const { data, error, response } = await api.POST('/api/receitas', { body: dados })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-46.1: na de todo mês, o valor e o dia valem do mês atual em diante. */
export async function alterarReceita(id: string, dados: DadosReceita): Promise<Receita> {
  const { data, error, response } = await api.PUT('/api/receitas/{id}', { params: { path: { id } }, body: dados })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** Só a de todo mês: para de gerar a partir do próximo mês. */
export async function encerrarReceita(id: string): Promise<Receita> {
  const { data, error, response } = await api.POST('/api/receitas/{id}/encerrar', { params: { path: { id } } })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-46.1: some com todos os meses dela. */
export async function excluirReceita(id: string): Promise<void> {
  const { error, response } = await api.DELETE('/api/receitas/{id}', { params: { path: { id } } })
  if (!response.ok) throw erroDaApi(error, response)
}

/** HU-22.2: caiu; sem valor, o previsto. */
export async function confirmarReceita(id: string, valorRecebido?: number): Promise<ReceitaDoMes> {
  const { data, error, response } = await api.POST('/api/receitas/ocorrencias/{id}/confirmacao', {
    params: { path: { id } },
    body: { valorRecebido },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** Não caiu, afinal. */
export async function desfazerConfirmacao(id: string): Promise<ReceitaDoMes> {
  const { data, error, response } = await api.DELETE('/api/receitas/ocorrencias/{id}/confirmacao', {
    params: { path: { id } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

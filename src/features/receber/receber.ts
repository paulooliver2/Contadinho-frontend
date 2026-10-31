import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'

export type Resumo = components['schemas']['ResumoResposta']
export type Situacao = components['schemas']['SituacaoResposta']
export type Historico = components['schemas']['HistoricoResposta']
export type CompraAtribuida = components['schemas']['CompraResposta']
export type Pagamento = components['schemas']['PagamentoResposta']

/** HU-18: total a receber, já recebido e a situação de quem tem algo registrado, pelo vencimento mais próximo. */
export async function buscarResumo(): Promise<Resumo> {
  const { data, error, response } = await api.GET('/api/receber')
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-18.3: a situação da pessoa, as compras atribuídas a ela e os pagamentos que ela fez. */
export async function buscarHistorico(pessoaId: string): Promise<Historico> {
  const { data, error, response } = await api.GET('/api/receber/pessoas/{pessoaId}', {
    params: { path: { pessoaId } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-19: parcial ou o saldo inteiro; abate primeiro o que vence antes (RN-30). Maior que o saldo é recusado. */
export async function registrarPagamento(pessoaId: string, valor: number, recebidoEm: string): Promise<Pagamento> {
  const { data, error, response } = await api.POST('/api/receber/pessoas/{pessoaId}/pagamentos', {
    params: { path: { pessoaId } },
    body: { valor, recebidoEm },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-19.3: o saldo volta e os abatimentos são refeitos. */
export async function desfazerPagamento(id: string) {
  const { error, response } = await api.DELETE('/api/receber/pagamentos/{id}', { params: { path: { id } } })
  if (!response.ok) throw erroDaApi(error, response)
}

/** RN-29, como se lê na tela. */
export const STATUS: Record<Situacao['status'], string> = {
  PENDENTE: 'pendente',
  PAGOU_PARTE: 'pagou parte',
  PAGO: 'pago',
}

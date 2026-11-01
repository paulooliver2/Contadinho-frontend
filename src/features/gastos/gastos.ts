import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'

export type ContasDoMes = components['schemas']['ContasDoMesResposta']
export type ContaDoMes = components['schemas']['OcorrenciaResposta']
export type ContaFixa = components['schemas']['ContaFixaResposta']
export type DadosContaFixa = components['schemas']['ContaFixaPedido']
export type FormaPagamento = DadosContaFixa['formaPagamento']

/** HU-11.2: as contas do mês (yyyy-MM), pelo vencimento, com os totais pago, a pagar e no cartão. */
export async function buscarContasDoMes(mes: string): Promise<ContasDoMes> {
  const { data, error, response } = await api.GET('/api/contas-fixas/mes/{mes}', { params: { path: { mes } } })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-11.1: a primeira ocorrência é a do mês atual. */
export async function cadastrarContaFixa(dados: DadosContaFixa): Promise<ContaFixa> {
  const { data, error, response } = await api.POST('/api/contas-fixas', { body: dados })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-11.3: o valor novo vale do mês atual em diante. */
export async function alterarContaFixa(id: string, dados: DadosContaFixa): Promise<ContaFixa> {
  const { data, error, response } = await api.PUT('/api/contas-fixas/{id}', { params: { path: { id } }, body: dados })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-11.4: para de gerar a partir do próximo mês; o histórico fica. */
export async function encerrarContaFixa(id: string): Promise<ContaFixa> {
  const { data, error, response } = await api.POST('/api/contas-fixas/{id}/encerrar', { params: { path: { id } } })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-13.1: sem data, vale hoje; sem valor, o previsto. Conta no cartão é recusada: entra pela fatura. */
export async function pagarConta(id: string, dados: { pagoEm?: string; valorPago?: number }): Promise<ContaDoMes> {
  const { data, error, response } = await api.POST('/api/contas-fixas/ocorrencias/{id}/pagamento', {
    params: { path: { id } },
    body: dados,
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-13.3: volta a ficar a pagar; débito automático desfeito não é marcado de novo (RN-24). */
export async function desfazerPagamentoConta(id: string): Promise<ContaDoMes> {
  const { data, error, response } = await api.DELETE('/api/contas-fixas/ocorrencias/{id}/pagamento', {
    params: { path: { id } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

export type CompraDaFatura = components['schemas']['CompraDaFatura']

/** HU-14.2: compras do cartão da conta perto do vencimento que ainda não pagam outra conta. */
export async function buscarCandidatas(id: string): Promise<CompraDaFatura[]> {
  const { data, error, response } = await api.GET('/api/contas-fixas/ocorrencias/{id}/candidatas', {
    params: { path: { id } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-14.2: liga a conta do mês a uma compra da fatura; passa a "na fatura". */
export async function ligarAFatura(id: string, lancamentoId: string): Promise<ContaDoMes> {
  const { data, error, response } = await api.PUT('/api/contas-fixas/ocorrencias/{id}/lancamento', {
    params: { path: { id } },
    body: { lancamentoId },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-14.2: volta a aguardar a fatura. */
export async function desligarDaFatura(id: string): Promise<ContaDoMes> {
  const { data, error, response } = await api.DELETE('/api/contas-fixas/ocorrencias/{id}/lancamento', {
    params: { path: { id } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-11.1, como se lê na tela. */
export const FORMAS: readonly { valor: FormaPagamento; rotulo: string }[] = [
  { valor: 'PIX_BOLETO', rotulo: 'Pix ou boleto' },
  { valor: 'DEBITO_AUTOMATICO', rotulo: 'Débito automático' },
  { valor: 'CARTAO', rotulo: 'Cartão' },
]

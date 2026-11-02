import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'

export type Fatura = components['schemas']['FaturaResposta']
export type Lancamento = components['schemas']['LancamentoResposta']
export type Compra = components['schemas']['CompraPedido']
export type Parte = components['schemas']['ParteResposta']
export type ImportacaoDaFatura = components['schemas']['ImportacaoDaFatura']
export type DesfazerImportacao = components['schemas']['DesfazerResposta']

/** A fatura de um mês de vencimento (RN-58). Sem compras, vem vazia com as datas calculadas. */
export async function buscarFatura(cartaoId: string, mes: string): Promise<Fatura> {
  const { data, error, response } = await api.GET('/api/cartoes/{cartaoId}/faturas/{mes}', {
    params: { path: { cartaoId, mes } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-44: o que sai e o que volta, antes de confirmar. */
export async function previaDesfazer(id: string): Promise<DesfazerImportacao> {
  const { data, error, response } = await api.GET('/api/importacoes/{id}/desfazer', { params: { path: { id } } })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** HU-44: tira da fatura as compras do arquivo; as digitadas que ele casou voltam a ser digitadas. */
export async function desfazerImportacao(id: string): Promise<DesfazerImportacao> {
  const { data, error, response } = await api.DELETE('/api/importacoes/{id}', { params: { path: { id } } })
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

export type Atribuicao = components['schemas']['AtribuicaoResposta']

/**
 * HU-08: de quem é a compra; `pessoaId` null devolve ao dono. Com `proximas`, as próximas parcelas da mesma compra
 * também (RN-17): as já gravadas mudam agora e as outras chegam atribuídas.
 */
export async function atribuirResponsavel(id: string, pessoaId: string | null, proximas: boolean): Promise<Atribuicao> {
  const { data, error, response } = await api.PUT('/api/lancamentos/{id}/responsavel', {
    params: { path: { id } },
    body: { pessoaId: pessoaId ?? undefined, proximas },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

export type Previa = components['schemas']['PreviaResposta']
export type ItemPrevia = components['schemas']['ItemPreviaResposta']
export type Importacao = components['schemas']['ImportacaoResposta']

/**
 * O arquivo escolhido, em base64: o servidor precisa dos bytes como vieram. `senha` só existe quando o PDF tem
 * uma (HU-39); fica na memória da folha de importação e não é guardada.
 */
export interface ArquivoLido {
  nomeArquivo: string
  conteudo: string
  senha?: string
}

export function lerArquivo(arquivo: File): Promise<ArquivoLido> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader()
    leitor.onload = () => {
      const url = String(leitor.result)
      resolver({ nomeArquivo: arquivo.name, conteudo: url.slice(url.indexOf(',') + 1) })
    }
    leitor.onerror = () => rejeitar(leitor.error)
    leitor.readAsDataURL(arquivo)
  })
}

/** HU-06: lê o arquivo e mostra o que vai entrar, sem gravar. Sem `mes`, o servidor sugere a fatura (RN-09). */
export async function previaImportacao(cartaoId: string, arquivo: ArquivoLido, mes?: string): Promise<Previa> {
  const { data, error, response } = await api.POST('/api/cartoes/{cartaoId}/importacoes/previa', {
    params: { path: { cartaoId } },
    body: { ...arquivo, mes },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

/** `mesmas`: as compras do arquivo que o dono confirmou serem a digitada apontada na prévia (RN-59). */
export async function importarFatura(
  cartaoId: string,
  arquivo: ArquivoLido,
  mes: string,
  mesmas: { idExterno: string; lancamentoId: string }[],
): Promise<Importacao> {
  const { data, error, response } = await api.POST('/api/cartoes/{cartaoId}/importacoes', {
    params: { path: { cartaoId } },
    body: { ...arquivo, mes, mesmas },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

export async function excluirCompra(id: string): Promise<void> {
  const { error, response } = await api.DELETE('/api/lancamentos/{id}', { params: { path: { id } } })
  if (!response.ok) throw erroDaApi(error, response)
}

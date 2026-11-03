import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'
import { useSessao } from './sessao'

export type Carteira = components['schemas']['Carteira']
export type PosicaoResumo = components['schemas']['PosicaoResumo']
export type PosicaoDetalhe = components['schemas']['PosicaoDetalhe']
export type Movimentacao = components['schemas']['MovimentacaoResposta']
export type NovoInvestimento = components['schemas']['NovoInvestimento']
export type NovaMovimentacao = components['schemas']['NovaMovimentacao']
export type CriptoEncontrada = components['schemas']['CriptoEncontrada']
export type TipoInvestimento = PosicaoResumo['tipo']

/**
 * A carteira de investimentos (HU-30). O servidor calcula quantidade, preço médio e aplicado; a lista é recarregada
 * depois de cada mudança para o total aplicado não ficar para trás.
 */
export const useCarteira = defineStore('carteira', () => {
  const carteira = ref<Carteira | null>(null)
  /** HU-31: a busca das cotações velhas, depois de a tela já mostrar o que estava guardado. */
  const atualizando = ref(false)
  const erroAtualizacao = ref('')
  /** Muda a cada saída da conta: a resposta que chegar depois, de quem saiu, é descartada. */
  let geracao = 0
  /** A atualização em andamento (com a da fila, se houver) e se outra foi pedida no meio dela. */
  let emAndamento: Promise<void> | null = null
  let pendente = false

  async function carregar() {
    const minha = geracao
    const { data, error, response } = await api.GET('/api/investimentos')
    if (!data) throw erroDaApi(error, response)
    if (minha === geracao) carteira.value = data
  }

  /** Depois de salvar, a lista é atualizada sem segurar quem salvou: a falha aparece ao abrir a Carteira. */
  function recarregar() {
    // HU-31: o ativo novo já ganha cotação, sem esperar reabrir a tela.
    carregar()
      .then(() => atualizar())
      .catch(() => {})
  }

  async function criar(novo: NovoInvestimento): Promise<PosicaoDetalhe> {
    const { data, error, response } = await api.POST('/api/investimentos', { body: novo })
    if (!data) throw erroDaApi(error, response)
    recarregar()
    return data
  }

  async function detalhe(id: string): Promise<PosicaoDetalhe> {
    const { data, error, response } = await api.GET('/api/investimentos/{id}', { params: { path: { id } } })
    if (!data) throw erroDaApi(error, response)
    return data
  }

  async function movimentar(id: string, mov: NovaMovimentacao): Promise<PosicaoDetalhe> {
    const { data, error, response } = await api.POST('/api/investimentos/{id}/movimentacoes', {
      params: { path: { id } },
      body: mov,
    })
    if (!data) throw erroDaApi(error, response)
    recarregar()
    return data
  }

  async function excluirMovimentacao(id: string, movimentacaoId: string): Promise<PosicaoDetalhe> {
    const { data, error, response } = await api.DELETE('/api/investimentos/{id}/movimentacoes/{movimentacaoId}', {
      params: { path: { id, movimentacaoId } },
    })
    if (!data) throw erroDaApi(error, response)
    recarregar()
    return data
  }

  async function excluir(id: string) {
    const { error, response } = await api.DELETE('/api/investimentos/{id}', { params: { path: { id } } })
    if (!response.ok) throw erroDaApi(error, response)
    if (carteira.value) carteira.value = { ...carteira.value, posicoes: carteira.value.posicoes.filter((p) => p.id !== id) }
    recarregar()
  }

  /**
   * Busca o que está velho e troca a carteira; uma falha só deixa a mensagem, e a tela fica como estava. Um pedido no
   * meio de outro entra na fila, para não perder a posição que acabou de entrar; a promessa só termina depois da fila,
   * então quem espera (o detalhe) relê os números novos.
   */
  function atualizar(): Promise<void> {
    if (emAndamento) {
      pendente = true
      return emAndamento
    }
    const minha = geracao
    emAndamento = (async () => {
      atualizando.value = true
      do {
        pendente = false
        erroAtualizacao.value = ''
        try {
          const { data, error, response } = await api.POST('/api/investimentos/atualizar')
          if (!data) throw erroDaApi(error, response)
          if (minha === geracao) carteira.value = data
        } catch {
          if (minha === geracao) erroAtualizacao.value = 'Não deu para atualizar agora'
        }
      } while (pendente && minha === geracao)
    })().finally(() => {
      if (minha === geracao) {
        atualizando.value = false
        emAndamento = null
      }
    })
    return emAndamento
  }

  async function buscarCripto(texto: string): Promise<CriptoEncontrada[]> {
    const { data, error, response } = await api.GET('/api/investimentos/cripto', { params: { query: { busca: texto } } })
    if (!data) throw erroDaApi(error, response)
    return data
  }

  // Outro dono pode entrar neste aparelho: nada do anterior fica na memória.
  const sessao = useSessao()
  watch(
    () => sessao.logado,
    (logado) => {
      if (logado) return
      geracao++
      carteira.value = null
      erroAtualizacao.value = ''
      atualizando.value = false
      emAndamento = null
      pendente = false
    },
  )

  return { carteira, atualizando, erroAtualizacao, atualizar, carregar, criar, detalhe, movimentar, excluirMovimentacao, excluir, buscarCripto }
})

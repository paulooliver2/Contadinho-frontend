import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'
import { useSessao } from './sessao'

export type Pessoa = components['schemas']['PessoaResposta']
export type DadosPessoa = components['schemas']['PessoaPedido']

const porNome = (a: Pessoa, b: Pessoa) => a.nome.localeCompare(b.nome, 'pt-BR')

/**
 * Pessoas do dono (HU-16), separadas em ativas e arquivadas (HU-42). As ativas são as das listas de escolha
 * (atribuir compra, registrar empréstimo); as arquivadas só aparecem em A receber (RN-36).
 */
export const usePessoas = defineStore('pessoas', () => {
  const ativas = ref<Pessoa[]>([])
  const arquivadas = ref<Pessoa[]>([])
  const carregado = ref(false)

  async function carregar() {
    const [listaAtivas, listaArquivadas] = await Promise.all([
      api.GET('/api/pessoas'),
      api.GET('/api/pessoas', { params: { query: { arquivadas: true } } }),
    ])
    if (!listaAtivas.data) throw erroDaApi(listaAtivas.error, listaAtivas.response)
    if (!listaArquivadas.data) throw erroDaApi(listaArquivadas.error, listaArquivadas.response)
    ativas.value = listaAtivas.data
    arquivadas.value = listaArquivadas.data
    carregado.value = true
  }

  /** Põe a pessoa na lista certa, já em ordem de nome, tirando a versão anterior. */
  function guardar(pessoa: Pessoa) {
    ativas.value = ativas.value.filter((p) => p.id !== pessoa.id)
    arquivadas.value = arquivadas.value.filter((p) => p.id !== pessoa.id)
    const lista = pessoa.arquivada ? arquivadas : ativas
    lista.value = [...lista.value, pessoa].sort(porNome)
    return pessoa
  }

  async function cadastrar(dados: DadosPessoa): Promise<Pessoa> {
    const { data, error, response } = await api.POST('/api/pessoas', { body: dados })
    if (!data) throw erroDaApi(error, response)
    return guardar(data)
  }

  async function alterar(id: string, dados: DadosPessoa): Promise<Pessoa> {
    const { data, error, response } = await api.PUT('/api/pessoas/{id}', { params: { path: { id } }, body: dados })
    if (!data) throw erroDaApi(error, response)
    return guardar(data)
  }

  async function arquivar(id: string): Promise<Pessoa> {
    const { data, error, response } = await api.POST('/api/pessoas/{id}/arquivar', { params: { path: { id } } })
    if (!data) throw erroDaApi(error, response)
    return guardar(data)
  }

  async function desarquivar(id: string): Promise<Pessoa> {
    const { data, error, response } = await api.POST('/api/pessoas/{id}/desarquivar', { params: { path: { id } } })
    if (!data) throw erroDaApi(error, response)
    return guardar(data)
  }

  async function excluir(id: string) {
    const { error, response } = await api.DELETE('/api/pessoas/{id}', { params: { path: { id } } })
    if (!response.ok) throw erroDaApi(error, response)
    ativas.value = ativas.value.filter((p) => p.id !== id)
    arquivadas.value = arquivadas.value.filter((p) => p.id !== id)
  }

  // Outro dono pode entrar neste aparelho: nada do anterior fica na memória.
  const sessao = useSessao()
  watch(
    () => sessao.logado,
    (logado) => {
      if (logado) return
      ativas.value = []
      arquivadas.value = []
      carregado.value = false
    },
  )

  /** Como a pessoa aparece em listas curtas (responsável da compra): o apelido, ou o nome. */
  function rotulo(id: string): string {
    const pessoa = ativas.value.find((p) => p.id === id) ?? arquivadas.value.find((p) => p.id === id)
    return pessoa ? (pessoa.apelido ?? pessoa.nome) : 'Pessoa'
  }

  /**
   * Cor da pessoa na divisão da fatura (HU-10). Segue a pessoa, não a posição na fatura: é a ordem de nome entre
   * todas as pessoas, então filtrar ou trocar de mês não repinta ninguém. Null é o dono.
   */
  function cor(id: string | null): string {
    if (!id) return 'var(--serie-dono)'
    const indice = [...ativas.value, ...arquivadas.value].sort(porNome).findIndex((p) => p.id === id)
    return indice >= 0 && indice < 6 ? `var(--serie-${indice + 1})` : 'var(--serie-outras)'
  }

  return { ativas, arquivadas, carregado, carregar, cadastrar, alterar, arquivar, desarquivar, excluir, rotulo, cor }
})

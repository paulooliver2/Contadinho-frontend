import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'
import { useSessao } from './sessao'

export type Categoria = components['schemas']['CategoriaResposta']

/** As categorias do dono (HU-15), arquivadas inclusive: gastos antigos ainda mostram a delas (RN-27). */
export const useCategorias = defineStore('categorias', () => {
  const lista = ref<Categoria[]>([])
  const carregado = ref(false)

  /** As que entram nas opções de gasto novo. */
  const ativas = computed(() => lista.value.filter((c) => !c.arquivada))

  async function carregar() {
    const { data, error, response } = await api.GET('/api/categorias')
    if (!data) throw erroDaApi(error, response)
    lista.value = data
    carregado.value = true
  }

  function porId(id: string): Categoria | undefined {
    return lista.value.find((c) => c.id === id)
  }

  // Outro dono pode entrar neste aparelho: nada do anterior fica na memória.
  const sessao = useSessao()
  watch(
    () => sessao.logado,
    (logado) => {
      if (logado) return
      lista.value = []
      carregado.value = false
    },
  )

  return { lista, ativas, carregado, carregar, porId }
})

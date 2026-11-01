import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import type { components } from '@/api/schema'
import * as notificacoes from '@/lib/notificacoes'
import { useSessao } from './sessao'

export type Aviso = components['schemas']['AvisoResposta']
export type Preferencias = components['schemas']['PreferenciasResposta']

/** Já explicou os avisos neste aparelho: a explicação aparece uma vez só (HU-25). */
const EXPLICADO = 'contadinho.avisos-explicados'

function lerExplicado(): boolean {
  try {
    return localStorage.getItem(EXPLICADO) === 'sim'
  } catch {
    return false
  }
}

/**
 * Os avisos deste aparelho (Épico 6). O servidor diz o que avisar; aqui se pede a permissão e se troca o que está
 * agendado no celular sempre que o app abre ou algo que gera aviso muda (HU-29).
 */
export const useAvisos = defineStore('avisos', () => {
  const permissao = ref<notificacoes.Permissao | null>(null)
  /** O que foi agendado da última vez, para a tela Avisos mostrar. */
  const agendados = ref<Aviso[]>([])
  /** A folha que explica os avisos antes do pedido do sistema. */
  const explicando = ref(false)
  /** HU-28: ficam no servidor, então valem em qualquer celular. */
  const preferencias = ref<Preferencias | null>(null)

  async function carregarPreferencias() {
    const { data, error, response } = await api.GET('/api/avisos/preferencias')
    if (!data) throw erroDaApi(error, response)
    preferencias.value = data
    return data
  }

  /** Salva e reagenda: a agenda nova já sai com as preferências (HU-28, HU-29.1). */
  async function salvarPreferencias(novas: Preferencias) {
    const { data, error, response } = await api.PUT('/api/avisos/preferencias', { body: novas })
    if (!data) throw erroDaApi(error, response)
    preferencias.value = data
    atualizar()
    return data
  }

  async function lerPermissao() {
    permissao.value = await notificacoes.lerPermissao()
    return permissao.value
  }

  let pendente: Promise<void> | null = null
  let deNovo = false

  /** Busca a agenda e troca o que está agendado. Pedidos durante uma troca viram uma troca só, depois dela. */
  async function reagendar(): Promise<void> {
    if (pendente) {
      deNovo = true
      return pendente
    }
    pendente = (async () => {
      do {
        deNovo = false
        if ((await lerPermissao()) !== 'concedida') return
        const { data, error, response } = await api.GET('/api/avisos/agenda')
        if (!data) throw erroDaApi(error, response)
        agendados.value = data
        await notificacoes.reagendar(
          data.map((a) => ({
            chave: a.chave,
            titulo: a.titulo,
            texto: a.texto,
            quando: a.quando,
            acao: a.acao,
            extra: { tela: a.destino.tela, id: a.destino.id ?? '', mes: a.destino.mes ?? '' },
          })),
        )
      } while (deNovo)
    })().finally(() => {
      pendente = null
    })
    return pendente
  }

  /** Reagenda sem atrapalhar quem chamou: se falhar, o próximo reagendamento corrige. */
  function atualizar() {
    reagendar().catch(() => undefined)
  }

  /**
   * HU-25.1: depois da primeira conta fixa ou do primeiro cartão, explica o aviso antes do pedido do sistema. Só
   * quando o sistema ainda vai perguntar e a explicação não foi vista neste aparelho.
   */
  async function oferecer() {
    if (lerExplicado()) return
    if ((await lerPermissao()) === 'perguntar') explicando.value = true
  }

  /** Fechou a explicação, permitindo ou não: não aparece de novo. */
  function explicado() {
    explicando.value = false
    try {
      localStorage.setItem(EXPLICADO, 'sim')
    } catch {
      // Sem armazenamento, a explicação pode voltar; não é grave.
    }
  }

  async function permitir() {
    explicado()
    permissao.value = await notificacoes.pedirPermissao()
    atualizar()
    return permissao.value
  }

  // Ao abrir o app logado, reagenda (HU-29.2). Ao sair, os avisos saem do celular: outro dono pode entrar nele.
  const sessao = useSessao()
  watch(
    () => sessao.logado,
    (logado, antes) => {
      if (logado) {
        atualizar()
      } else if (antes) {
        agendados.value = []
        preferencias.value = null
        notificacoes.cancelarTodas().catch(() => undefined)
      }
    },
    { immediate: true },
  )

  return {
    permissao,
    agendados,
    explicando,
    preferencias,
    lerPermissao,
    reagendar,
    atualizar,
    oferecer,
    explicado,
    permitir,
    carregarPreferencias,
    salvarPreferencias,
  }
})

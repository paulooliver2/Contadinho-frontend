import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

/**
 * Notificações locais do celular (Épico 6), sem servidor de push. Só o app agenda de verdade: no navegador dá para ler
 * e pedir a permissão, mas um aviso para daqui a dias não sobrevive à aba, então nada é agendado.
 */
export type Permissao = 'concedida' | 'negada' | 'perguntar' | 'indisponivel'

export interface Notificacao {
  /** Estável entre reagendamentos. */
  chave: string
  titulo: string
  texto: string
  /** Horário local, sem fuso, como 2026-11-03T09:00:00. */
  quando: string
  /** O botão do aviso, como "Cobrar"; tocar no aviso ou no botão abre o mesmo destino. */
  acao?: string
  /** O que abrir ao tocar. */
  extra: Record<string, string>
}

const nativo = () => Capacitor.isNativePlatform()

function traduzir(estado: string): Permissao {
  if (estado === 'granted') return 'concedida'
  if (estado === 'denied') return 'negada'
  return 'perguntar'
}

export async function lerPermissao(): Promise<Permissao> {
  if (nativo()) return traduzir((await LocalNotifications.checkPermissions()).display)
  if (!('Notification' in window)) return 'indisponivel'
  return traduzir(Notification.permission)
}

/** Abre o pedido do sistema; depois de negado, o sistema não pergunta de novo. */
export async function pedirPermissao(): Promise<Permissao> {
  if (nativo()) return traduzir((await LocalNotifications.requestPermissions()).display)
  if (!('Notification' in window)) return 'indisponivel'
  return traduzir(await Notification.requestPermission())
}

/** O id numérico que o sistema pede, tirado da chave (hash de 31 bits). */
function id(chave: string): number {
  let h = 0
  for (const c of chave) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
  return h & 0x7fffffff
}

/** Os botões que o sistema mostra nos avisos, um tipo por texto ("Cobrar"). */
const acoes = new Map<string, string>()

async function tipoDaAcao(acao: string): Promise<string> {
  let tipo = acoes.get(acao)
  if (!tipo) {
    tipo = `ACAO_${acoes.size + 1}`
    acoes.set(acao, tipo)
    await LocalNotifications.registerActionTypes({
      types: [...acoes].map(([titulo, id]) => ({ id, actions: [{ id, title: titulo }] })),
    })
  }
  return tipo
}

/** Troca tudo o que está agendado por esta lista (HU-29). */
export async function reagendar(lista: Notificacao[]): Promise<void> {
  if (!nativo()) return
  await cancelarTodas()
  if (lista.length === 0) return
  const notifications = []
  for (const n of lista) {
    notifications.push({
      id: id(n.chave),
      title: n.titulo,
      body: n.texto,
      schedule: { at: new Date(n.quando), allowWhileIdle: true },
      actionTypeId: n.acao ? await tipoDaAcao(n.acao) : undefined,
      extra: n.extra,
    })
  }
  await LocalNotifications.schedule({ notifications })
}

export async function cancelarTodas(): Promise<void> {
  if (!nativo()) return
  const { notifications } = await LocalNotifications.getPending()
  if (notifications.length) await LocalNotifications.cancel({ notifications: notifications.map((n) => ({ id: n.id })) })
}

/** HU-26.3 e HU-27.2: tocar no aviso, ou no botão dele, abre a tela dele. */
export function aoTocar(acao: (extra: Record<string, string>) => void) {
  if (!nativo()) return
  LocalNotifications.addListener('localNotificationActionPerformed', (evento) => acao(evento.notification.extra ?? {}))
}

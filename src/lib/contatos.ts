import { Capacitor } from '@capacitor/core'
import { Contacts, PhoneType } from '@capacitor-community/contacts'

export interface ContatoEscolhido {
  nome: string
  numero: string
}

/** A agenda só existe no app do celular; no navegador o número é digitado. */
export function podeEscolherContato(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * HU-16: abre a agenda do celular e lê só o contato escolhido, nome e telefones; nada mais sai do aparelho.
 * O Android pede a permissão na primeira vez. Se a pessoa fechar a agenda sem escolher, a promessa não termina.
 */
export async function escolherContato(): Promise<ContatoEscolhido> {
  const { contact } = await Contacts.pickContact({ projection: { name: true, phones: true } })
  const telefones = contact.phones ?? []
  const celular = telefones.find((t) => t.type === PhoneType.Mobile && t.number) ?? telefones.find((t) => t.number)
  return { nome: contact.name?.display?.trim() ?? '', numero: celular?.number ?? '' }
}

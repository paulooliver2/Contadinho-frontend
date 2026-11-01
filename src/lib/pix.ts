import type { TipoPix } from '@/stores/conta'
import { formatarWhatsapp } from './telefone'

/** Os tipos de chave do Pix, na ordem da tela de Configurações (HU-03). */
export const TIPOS_PIX: readonly { valor: TipoPix; rotulo: string }[] = [
  { valor: 'CPF', rotulo: 'CPF' },
  { valor: 'EMAIL', rotulo: 'E-mail' },
  { valor: 'CELULAR', rotulo: 'Celular' },
  { valor: 'ALEATORIA', rotulo: 'Aleatória' },
]

/** Como a chave aparece na tela e na mensagem: CPF com pontos e celular com DDD; e-mail e aleatória como estão. */
export function formatarChave(tipo: TipoPix, chave: string): string {
  if (tipo === 'CPF') return chave.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  if (tipo === 'CELULAR') return formatarWhatsapp(chave)
  return chave
}

/** O que cada tipo espera, para o placeholder do campo. */
export const EXEMPLO_PIX: Record<TipoPix, string> = {
  CPF: '123.456.789-09',
  EMAIL: 'voce@email.com',
  CELULAR: '(61) 99999-8888',
  ALEATORIA: 'Cole a chave aleatória',
}

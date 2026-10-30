/**
 * RN-35: o WhatsApp é guardado como +55, DDD e 8 ou 9 dígitos. A mesma regra do servidor, para avisar antes de
 * enviar; aceita "(61) 99999-8888", "+55 61 99999-8888" e o "0" de longa distância de contatos antigos.
 */
export function normalizarWhatsapp(texto: string): string | null {
  let digitos = texto.replace(/\D/g, '')
  if (digitos.startsWith('0') && (digitos.length === 11 || digitos.length === 12)) digitos = digitos.slice(1)
  if (digitos.startsWith('55') && (digitos.length === 12 || digitos.length === 13)) digitos = digitos.slice(2)
  return /^[1-9][1-9](9\d{8}|[2-8]\d{7})$/.test(digitos) ? `+55${digitos}` : null
}

/** "+5561999998888" → "(61) 99999-8888", como se lê no Brasil. */
export function formatarWhatsapp(numero: string): string {
  const local = numero.replace(/^\+55/, '')
  const ddd = local.slice(0, 2)
  const resto = local.slice(2)
  const corte = resto.length - 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

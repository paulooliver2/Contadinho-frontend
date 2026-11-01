/** Valores e datas como o app mostra e lê: reais pt-BR, datas ISO (yyyy-MM-dd) e meses yyyy-MM. */

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function reais(valor: number): string {
  return moeda.format(valor)
}

/** "1.234,56", "1.300", "120,5" ou "120.50" viram número; null se não for um valor com até 2 casas. */
export function lerValor(texto: string): number | null {
  let limpo = texto.replace(/\s|R\$/g, '')
  // Ponto com vírgula, ou pontos separando grupos de 3, são milhar.
  if (limpo.includes(',') || /^\d{1,3}(\.\d{3})+$/.test(limpo)) limpo = limpo.replace(/\./g, '').replace(',', '.')
  return /^\d+(\.\d{1,2})?$/.test(limpo) ? Number(limpo) : null
}

/** O contrário de `lerValor`, para preencher o campo ao editar: 1234.5 vira "1234,50". */
export function valorParaCampo(valor: number): string {
  return Math.abs(valor).toFixed(2).replace('.', ',')
}

/** "2026-10-03" vira "03/10". */
export function diaMes(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

/** "2026-11-10" vira "10/nov". */
export function diaMesCurto(iso: string): string {
  const [, mes, dia] = iso.split('-').map(Number)
  return `${String(dia).padStart(2, '0')}/${nomesMeses[mes - 1].slice(0, 3)}`
}

/** O mesmo dia `quantos` meses depois; sem esse dia no mês, o último (31/01 + 1 vira 28/02). */
export function somarMesesData(iso: string, quantos: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const alvo = somarMeses(`${ano}-${String(mes).padStart(2, '0')}`, quantos)
  const [anoAlvo, mesAlvo] = alvo.split('-').map(Number)
  const ultimo = new Date(anoAlvo, mesAlvo, 0).getDate()
  return `${alvo}-${String(Math.min(dia, ultimo)).padStart(2, '0')}`
}

/** HU-20.4: "cobrado hoje", "cobrado ontem" ou "cobrado há 3 dias", contando dias do calendário do aparelho. */
export function cobradoHa(instante: string): string {
  const quando = new Date(instante)
  const agora = new Date()
  const dia = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  const dias = Math.round((dia(agora) - dia(quando)) / 86_400_000)
  if (dias <= 0) return 'cobrado hoje'
  if (dias === 1) return 'cobrado ontem'
  return `cobrado há ${dias} dias`
}

/** Quantos dias de `de` até `ate`, as duas em yyyy-MM-dd; negativo se `ate` vem antes. */
export function diasEntre(de: string, ate: string): number {
  const dia = (iso: string) => {
    const [ano, mes, d] = iso.split('-').map(Number)
    return Date.UTC(ano, mes - 1, d)
  }
  return Math.round((dia(ate) - dia(de)) / 86_400_000)
}

/** Hoje no fuso do aparelho, como yyyy-MM-dd. */
export function hojeIso(): string {
  const agora = new Date()
  const doisDigitos = (n: number) => String(n).padStart(2, '0')
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`
}

const nomesMeses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

/** "2026-11" vira "novembro de 2026". */
export function mesPorExtenso(mes: string): string {
  const [ano, numero] = mes.split('-').map(Number)
  return `${nomesMeses[numero - 1]} de ${ano}`
}

/** Anda `quantos` meses a partir de yyyy-MM (negativo volta). */
export function somarMeses(mes: string, quantos: number): string {
  const [ano, numero] = mes.split('-').map(Number)
  const total = ano * 12 + (numero - 1) + quantos
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`
}

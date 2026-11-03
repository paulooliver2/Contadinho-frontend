import { reais } from '@/lib/formatos'
import type { Classe, Periodo, PosicaoResumo, TipoInvestimento } from '@/stores/carteira'

/** Quantas casas cada tipo aceita na quantidade (HU-30): ação inteira, Tesouro 2, cripto 8. */
export const CASAS_QUANTIDADE: Record<TipoInvestimento, number> = { ACAO: 0, TESOURO: 2, CRIPTO: 8, RENDA_FIXA: 2 }

/** O preço unitário aceita até 8 casas, para a cripto barata. */
export const CASAS_PRECO = 8

/**
 * Lê um número digitado com até `casas` casas: "1.234,56", "0,005", "0.005" ou "1.000". Com vírgula, os pontos são
 * milhar; sem vírgula, pontos em grupos de 3 (começando por outro dígito que não zero) também. Null se não couber.
 */
export function lerNumero(texto: string, casas: number): number | null {
  let limpo = texto.replace(/\s|R\$/g, '')
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.')
  else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(limpo)) limpo = limpo.replace(/\./g, '')
  const padrao = casas === 0 ? /^\d+$/ : new RegExp(`^\\d+(\\.\\d{1,${casas}})?$`)
  if (!padrao.test(limpo)) return null
  const n = Number(limpo)
  return n > 0 ? n : null
}

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const ate8 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 8 })
const duas = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "100 ações", "1,37 títulos", "0,005 BTC". */
export function quantidade(p: Pick<PosicaoResumo, 'tipo' | 'simbolo'>, valor: number): string {
  switch (p.tipo) {
    case 'ACAO':
      return `${inteiro.format(valor)} ${valor === 1 ? 'ação' : 'ações'}`
    case 'TESOURO':
      return `${duas.format(valor)} ${valor === 1 ? 'título' : 'títulos'}`
    default:
      return `${ate8.format(valor)} ${p.simbolo ?? ''}`.trim()
  }
}

/** Preço em reais; abaixo de R$ 1, a cripto mostra até 8 casas para não virar R$ 0,00. */
export function preco(valor: number): string {
  if (valor >= 1 || valor === 0) return reais(valor)
  return `R$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 }).format(valor)}`
}

/** "110% do CDI" ou "12,5% ao ano". */
export function taxa(p: Pick<PosicaoResumo, 'indexador' | 'taxa'>): string {
  const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(p.taxa ?? 0)
  return p.indexador === 'CDI' ? `${numero}% do CDI` : `${numero}% ao ano`
}

/** "2028-11-03" vira "03/11/2028". */
export function dataCompleta(iso: string): string {
  const [ano, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${ano}`
}

/** O nome que aparece nas listas: a empresa, a moeda, o título ou "CDB Banco X". */
export function titulo(p: Pick<PosicaoResumo, 'tipo' | 'nome' | 'codigo' | 'produto'>): string {
  if (p.tipo === 'RENDA_FIXA') return `${p.produto} ${p.codigo}`
  return p.nome ?? p.codigo
}

export const ROTULOS_TIPO: Record<TipoInvestimento, string> = {
  ACAO: 'Ações',
  CRIPTO: 'Cripto',
  TESOURO: 'Tesouro',
  RENDA_FIXA: 'Renda fixa',
}

const porcento = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** HU-31: "+R$ 250,00 · +8,30%" ou "−R$ 50,00 · −2,10%"; o sinal vem sempre no texto, não só na cor. */
export function ganho(valor: number, percentual?: number | null): string {
  const sinal = valor > 0 ? '+' : valor < 0 ? '−' : ''
  const emReais = `${sinal}${reais(Math.abs(valor))}`
  if (percentual == null) return emReais
  const sinalPct = percentual > 0 ? '+' : percentual < 0 ? '−' : ''
  return `${emReais} · ${sinalPct}${porcento.format(Math.abs(percentual))}%`
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/** "14:32" se for hoje no aparelho, senão "31/10 18:00". */
export function quando(instante: string): { hoje: boolean; texto: string } {
  const d = new Date(instante)
  const agora = new Date()
  const hora = `${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
  const hoje = d.toDateString() === agora.toDateString()
  return { hoje, texto: hoje ? hora : `${doisDigitos(d.getDate())}/${doisDigitos(d.getMonth() + 1)} ${hora}` }
}

/** HU-32: as classes da distribuição, na ordem do servidor, com uma cor fixa cada. */
export const ROTULOS_CLASSE: Record<Classe, string> = {
  RENDA_FIXA: 'Renda fixa',
  ACOES: 'Ações',
  FIIS: 'FIIs',
  CRIPTO: 'Cripto',
}

export const CORES_CLASSE: Record<Classe, string> = {
  RENDA_FIXA: 'var(--serie-1)',
  ACOES: 'var(--serie-2)',
  FIIS: 'var(--serie-3)',
  CRIPTO: 'var(--serie-4)',
}

export const PERIODOS: readonly { valor: Periodo; rotulo: string }[] = [
  { valor: 'DIA', rotulo: 'Dia' },
  { valor: 'MES', rotulo: 'Mês' },
  { valor: 'SEIS_MESES', rotulo: '6 meses' },
  { valor: 'DOZE_MESES', rotulo: '12 meses' },
]

/** "+0,90%", "−1,20%" ou "0,00%". */
export function percentual(valor: number): string {
  const sinal = valor > 0 ? '+' : valor < 0 ? '−' : ''
  return `${sinal}${porcento.format(Math.abs(valor))}%`
}

/** "2026-11-03" vira "03/11". */
export function diaMes(iso: string): string {
  const [, mes, dia] = iso.split('-')
  return `${dia}/${mes}`
}

import { api } from '@/api/client'
import { erroDaApi } from '@/api/erros'
import { diaMesCurto, reais } from '@/lib/formatos'
import { formatarChave } from '@/lib/pix'
import type { Pix } from '@/stores/conta'
import type { Historico } from './receber'

/** De onde vem o que a pessoa deve: um cartão (somando as faturas dele) ou um empréstimo. */
export interface Origem {
  tipo: 'CARTAO' | 'EMPRESTIMO'
  nome: string
  valor: number
}

/**
 * RN-34: o que ainda falta, por origem, depois de abater os pagamentos (RN-30). As compras somam por cartão; cada
 * empréstimo é uma origem.
 */
export function origens(historico: Historico): Origem[] {
  const lista: Origem[] = []
  for (const c of historico.compras) {
    if (c.emAberto <= 0) continue
    // "Itaú •• 3310" vira "cartão Itaú": o final do cartão não ajuda quem vai pagar.
    const nome = `cartão ${c.cartao.split(' •• ')[0]}`
    const origem = lista.find((o) => o.tipo === 'CARTAO' && o.nome === nome)
    if (origem) origem.valor = Math.round((origem.valor + c.emAberto) * 100) / 100
    else lista.push({ tipo: 'CARTAO', nome, valor: c.emAberto })
  }
  for (const e of historico.emprestimos) {
    const valor = Math.round(e.parcelas.reduce((soma, p) => soma + p.emAberto, 0) * 100) / 100
    if (valor > 0) lista.push({ tipo: 'EMPRESTIMO', nome: e.descricao ? `empréstimo (${e.descricao})` : 'empréstimo', valor })
  }
  return lista
}

/** HU-21: as únicas variáveis do modelo, exatamente assim (o servidor confere as mesmas). */
export const VARIAVEIS = ['nome', 'valor', 'vencimento', 'pix', 'detalhe'] as const

/** HU-21: o texto padrão escrito como modelo, para o dono partir dele. */
export const MODELO_INICIAL =
  'Oi, {nome}! Segue o que ficou em aberto:\n{detalhe}\nTotal: {valor}, vence dia {vencimento}.\nPode mandar no Pix: {pix}\nValeu!'

/**
 * HU-21.2: variáveis que o app não conhece e chaves sem par impedem salvar; sem {detalhe}, quem deve em mais de uma
 * origem só vê o total (só avisa).
 */
export function problemasDoModelo(modelo: string): { desconhecidas: string[]; semPar: boolean; semDetalhe: boolean } {
  const desconhecidas: string[] = []
  let semPar = false
  let abre = -1
  for (let i = 0; i < modelo.length; i++) {
    if (modelo[i] === '{') {
      if (abre >= 0) semPar = true
      abre = i
    } else if (modelo[i] === '}') {
      if (abre < 0) {
        semPar = true
        continue
      }
      const nome = modelo.slice(abre + 1, i)
      if (!(VARIAVEIS as readonly string[]).includes(nome) && !desconhecidas.includes(`{${nome}}`)) desconhecidas.push(`{${nome}}`)
      abre = -1
    }
  }
  if (abre >= 0) semPar = true
  return { desconhecidas, semPar, semDetalhe: modelo.trim() !== '' && !modelo.includes('{detalhe}') }
}

const comInicial = (texto: string) => `${texto.charAt(0).toUpperCase()}${texto.slice(1)}`

/** O que entra numa cobrança, já calculado: serve para a pessoa de verdade e para a prévia do modelo. */
export interface DadosCobranca {
  nome: string
  total: number
  /** yyyy-MM-dd; null quando nada tem data (RN-32). */
  vencimento: string | null
  pix: Pix
  origens: Origem[]
}

/** HU-21: troca as variáveis do modelo; {detalhe} é uma linha por origem e {vencimento} sem data vira "a combinar". */
export function aplicarModelo(modelo: string, d: DadosCobranca): string {
  const valores: Record<(typeof VARIAVEIS)[number], string> = {
    nome: d.nome,
    valor: reais(d.total),
    vencimento: d.vencimento ? diaMesCurto(d.vencimento) : 'a combinar',
    pix: formatarChave(d.pix.tipo, d.pix.chave),
    detalhe: d.origens.map((o) => `• ${comInicial(o.nome)}: ${reais(o.valor)}`).join('\n'),
  }
  // Uma passada só, trocando por função: o que entra (apelido, descrição) não é lido de novo como variável nem
  // como padrão do replace ($&, $$).
  return modelo.replace(/\{(nome|valor|vencimento|pix|detalhe)\}/g, (_, v: (typeof VARIAVEIS)[number]) => valores[v])
}

/**
 * HU-20.1 e RN-34: a mensagem pronta, com o primeiro nome ou apelido, o valor de cada origem, o total, o
 * vencimento mais próximo e a chave Pix. Com o modelo do dono, usa o modelo (HU-21).
 */
export function mensagemDeCobranca(nome: string, historico: Historico, pix: Pix, modelo?: string | null): string {
  const lista = origens(historico)
  if (modelo && modelo.trim()) {
    return aplicarModelo(modelo, {
      nome,
      total: historico.situacao.saldo,
      vencimento: historico.situacao.proximoVencimento ?? null,
      pix,
      origens: lista,
    })
  }
  const total = reais(historico.situacao.saldo)
  const vence = historico.situacao.proximoVencimento ? diaMesCurto(historico.situacao.proximoVencimento) : null
  const linhas: string[] = []
  if (lista.length > 1) {
    linhas.push(`Oi, ${nome}! Segue o que ficou em aberto:`)
    for (const o of lista) linhas.push(`• ${comInicial(o.nome)}: ${reais(o.valor)}`)
    linhas.push(`Total: ${total}${vence ? `, o primeiro vence dia ${vence}` : ''}.`)
  } else {
    const o = lista[0]
    const deQue = o?.tipo === 'EMPRESTIMO' ? `A devolução do ${o.nome}` : `A fatura do ${o?.nome ?? 'cartão'}`
    linhas.push(`Oi, ${nome}!${vence ? ` ${deQue} vence dia ${vence}.` : ''}`)
    linhas.push(o?.tipo === 'EMPRESTIMO' ? `Ficou faltando ${total}.` : `Sua parte ficou em ${total}.`)
  }
  linhas.push(`Pode mandar no Pix: ${formatarChave(pix.tipo, pix.chave)}`)
  linhas.push('Valeu!')
  return linhas.join('\n')
}

/** HU-20.2: abre a conversa da pessoa com o texto preenchido; quem envia é o dono. */
export function linkWhatsapp(numero: string, texto: string): string {
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`
}

/** HU-20.4: guarda que a cobrança foi aberta agora, para mostrar "cobrado há X dias". */
export async function registrarCobranca(pessoaId: string) {
  const { data, error, response } = await api.POST('/api/receber/pessoas/{pessoaId}/cobrancas', {
    params: { path: { pessoaId } },
  })
  if (!data) throw erroDaApi(error, response)
  return data
}

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

/**
 * HU-20.1 e RN-34: a mensagem pronta, com o primeiro nome ou apelido, o valor de cada origem, o total, o
 * vencimento mais próximo e a chave Pix.
 */
export function mensagemDeCobranca(nome: string, historico: Historico, pix: Pix): string {
  const lista = origens(historico)
  const total = reais(historico.situacao.saldo)
  const vence = historico.situacao.proximoVencimento ? diaMesCurto(historico.situacao.proximoVencimento) : null
  const linhas: string[] = []
  if (lista.length > 1) {
    linhas.push(`Oi, ${nome}! Segue o que ficou em aberto:`)
    for (const o of lista) linhas.push(`• ${o.nome.charAt(0).toUpperCase()}${o.nome.slice(1)}: ${reais(o.valor)}`)
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

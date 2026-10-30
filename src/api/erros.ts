/** Erro devolvido pela API como ProblemDetail: o `detail` já vem escrito para mostrar ao usuário. */
export class ErroApi extends Error {
  readonly status: number
  /** Campo → mensagem, nos erros de validação. */
  readonly campos: Record<string, string>
  /** O que o app deve fazer em seguida, quando a API diz (ex.: SENHA_PDF pede a senha do arquivo). */
  readonly codigo?: string

  constructor(status: number, mensagem: string, campos: Record<string, string> = {}, codigo?: string) {
    super(mensagem)
    this.status = status
    this.campos = campos
    this.codigo = codigo
  }
}

interface Problema {
  detail?: string
  campos?: Record<string, string>
  codigo?: string
}

/** Monta o erro a partir do `error` e do `response` que o openapi-fetch devolve. */
export function erroDaApi(corpo: unknown, resposta: Response): ErroApi {
  const problema = (typeof corpo === 'object' && corpo !== null ? corpo : {}) as Problema
  return new ErroApi(resposta.status, problema.detail ?? 'Algo deu errado. Tente de novo.', problema.campos, problema.codigo)
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroApi) return erro.message
  // fetch rejeita com TypeError quando não chega no servidor.
  if (erro instanceof TypeError) return 'Não foi possível falar com o servidor. Confira sua conexão.'
  return 'Algo deu errado. Tente de novo.'
}

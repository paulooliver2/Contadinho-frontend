import { apiAberta } from '@/api/aberta'
import { erroDaApi } from '@/api/erros'

/** HU-40: o servidor responde igual exista a conta ou não. */
export async function pedirLinkDeRecuperacao(email: string) {
  const { error, response } = await apiAberta.POST('/api/auth/recuperar-senha', { body: { email } })
  if (!response.ok) throw erroDaApi(error, response)
}

/** Troca a senha pelo token do link. Todas as sessões da conta são encerradas no servidor (RN-04). */
export async function redefinirSenha(token: string, novaSenha: string) {
  const { error, response } = await apiAberta.POST('/api/auth/redefinir-senha', { body: { token, novaSenha } })
  if (!response.ok) throw erroDaApi(error, response)
}

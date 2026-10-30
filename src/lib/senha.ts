export interface RegraSenha {
  texto: string
  ok: boolean
}

/** RN-02, a mesma conta que o servidor faz. Usada no cadastro e, depois, na troca de senha (HU-40). */
export function regrasDaSenha(senha: string, repetida: string): RegraSenha[] {
  return [
    { texto: 'Pelo menos 10 caracteres', ok: senha.length >= 10 },
    { texto: 'Letras e números', ok: /\p{L}/u.test(senha) && /\d/.test(senha) },
    { texto: 'As duas senhas são iguais', ok: senha.length > 0 && senha === repetida },
  ]
}

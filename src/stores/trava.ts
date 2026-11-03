import { App } from '@capacitor/app'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { autenticar, verificar, type TipoBiometria } from '@/lib/biometria'
import { cofre } from '@/lib/cofre'
import { useSessao } from './sessao'

/** Fora do app por isso ou mais, volta bloqueado (HU-02.1). */
const FORA_MAXIMO_MS = 5 * 60_000
/** Falhas de biometria até pedir a senha da conta (HU-02.2). */
const FALHAS_ATE_SENHA = 3

/**
 * HU-02: a tela de bloqueio. Com a biometria ligada neste aparelho, o app abre bloqueado e volta bloqueado depois de
 * 5 minutos em segundo plano. 3 falhas (ou o bloqueio do sistema) levam à senha da conta.
 */
export const useTrava = defineStore('trava', () => {
  const sessao = useSessao()

  const bloqueado = ref(false)
  const falhas = ref(0)
  const pedirSenha = ref(false)
  const tipo = ref<TipoBiometria>('biometria')
  const disponivel = ref(false)
  const ligada = ref(false)
  /** A folha "Usar o Face ID para desbloquear?" depois do login com senha. */
  const oferta = ref(false)
  /** Em segundo plano com a biometria ligada: o app some da tela até voltar (foto do seletor de apps, volta). */
  const coberto = ref(false)

  let emailOferta = ''
  let pausouEm: number | null = null
  let tentando = false
  let inicio: Promise<void> | null = null

  async function atualizarAparelho() {
    const r = await verificar()
    disponivel.value = r.disponivel
    tipo.value = r.tipo
    return r
  }

  function travar() {
    bloqueado.value = true
    falhas.value = 0
    pedirSenha.value = false
  }

  function destravar() {
    bloqueado.value = false
    falhas.value = 0
    pedirSenha.value = false
  }

  /** Na abertura do app, depois de restaurar a sessão. Roda uma vez só. */
  function iniciar(): Promise<void> {
    inicio ??= (async () => {
      App.addListener('pause', () => aoPausar())
      App.addListener('resume', () => aoVoltar())
      ligada.value = (await cofre.lerBiometria()) === 'ligada'
      if (!ligada.value) return
      const aparelho = await atualizarAparelho()
      if (!aparelho.disponivel && aparelho.motivo === 'descadastrada') {
        // Biometria descadastrada no aparelho: não dá para desbloquear com ela, então vale como desligada.
        await cofre.apagarBiometria()
        ligada.value = false
        return
      }
      if (!sessao.logado) return
      travar()
      // Bloqueada pelo sistema (ou fora do ar): trava do mesmo jeito e pede a senha.
      if (!aparelho.disponivel) pedirSenha.value = true
    })()
    return inicio
  }

  function aoPausar(agora = Date.now()) {
    pausouEm = agora
    if (ligada.value && sessao.logado) coberto.value = true
  }

  function aoVoltar(agora = Date.now()) {
    const fora = pausouEm === null ? 0 : agora - pausouEm
    pausouEm = null
    coberto.value = false
    if (ligada.value && sessao.logado && !bloqueado.value && fora >= FORA_MAXIMO_MS) travar()
  }

  async function tentarBiometria() {
    if (tentando || !bloqueado.value) return
    tentando = true
    try {
      const r = await autenticar('Desbloquear o Contadinho')
      if (r === 'ok') destravar()
      else if (r === 'falhou') {
        falhas.value++
        if (falhas.value >= FALHAS_ATE_SENHA) pedirSenha.value = true
      } else if (r === 'bloqueada' || r === 'indisponivel') pedirSenha.value = true
    } finally {
      tentando = false
    }
  }

  /** A senha é conferida como um login, com o e-mail guardado no aparelho. Erro da API sobe para a tela. */
  async function desbloquearComSenha(senha: string) {
    const email = await cofre.lerEmail()
    if (!email) throw new Error('sem e-mail')
    await sessao.entrar(email, senha)
    destravar()
  }

  /** Depois do login com senha (ou do cadastro): oferece só se o aparelho tem biometria e nada foi escolhido. */
  async function oferecer(email: string) {
    const escolha = await cofre.lerBiometria()
    if (escolha === 'ligada') {
      // Sessão que venceu sozinha não apaga a escolha: segue ligada com o login novo.
      ligada.value = true
      await cofre.guardarEmail(email)
      return
    }
    if (escolha === null && (await atualizarAparelho()).disponivel) {
      emailOferta = email
      oferta.value = true
    }
  }

  /** Liga só se a biometria der certo uma vez, para confirmar. */
  async function ligar(email = emailOferta): Promise<boolean> {
    const r = await autenticar('Confirmar o desbloqueio com biometria')
    if (r !== 'ok') return false
    await cofre.guardarBiometria('ligada')
    await cofre.guardarEmail(email)
    ligada.value = true
    oferta.value = false
    return true
  }

  async function recusar() {
    await cofre.guardarBiometria('recusada')
    oferta.value = false
  }

  /** Desligar é um "não": a oferta não volta no próximo login. */
  async function desligar() {
    await cofre.guardarBiometria('recusada')
    ligada.value = false
  }

  /** Saiu da conta: nada fica bloqueado nem ligado na memória. */
  function esquecer() {
    destravar()
    ligada.value = false
    oferta.value = false
    coberto.value = false
    pausouEm = null
  }

  return {
    bloqueado,
    falhas,
    pedirSenha,
    tipo,
    disponivel,
    ligada,
    oferta,
    coberto,
    iniciar,
    atualizarAparelho,
    aoPausar,
    aoVoltar,
    tentarBiometria,
    desbloquearComSenha,
    oferecer,
    ligar,
    recusar,
    desligar,
    esquecer,
  }
})

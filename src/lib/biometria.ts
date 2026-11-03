import { BiometricAuth, BiometryError, BiometryErrorType, BiometryType } from '@aparajita/capacitor-biometric-auth'
import { Capacitor } from '@capacitor/core'

/** O que o aparelho tem, já com o nome que aparece nos textos (HU-02). */
export type TipoBiometria = 'faceId' | 'touchId' | 'digital' | 'biometria'
export type ResultadoBiometria = 'ok' | 'falhou' | 'cancelou' | 'bloqueada' | 'indisponivel'

/**
 * Só no navegador e só para os testes: a simulação do próprio plugin fica em memória e some ao recarregar.
 * `proximos` são os resultados das próximas tentativas; acabou a lista, dá certo.
 */
const SIMULADA = 'contadinho.biometria-simulada'
interface Simulada {
  tipo: TipoBiometria
  proximos?: ResultadoBiometria[]
  /** O aparelho tem biometria, mas ela está bloqueada pelo sistema ou foi descadastrada. */
  indisponivel?: 'bloqueada' | 'descadastrada'
}

/** Por que não dá para usar agora: só `descadastrada` vale como "desligada" (HU-02). */
export type MotivoIndisponivel = 'descadastrada' | 'outro'
export interface Aparelho {
  disponivel: boolean
  tipo: TipoBiometria
  motivo?: MotivoIndisponivel
}

function simulada(): Simulada | null {
  try {
    const texto = localStorage.getItem(SIMULADA)
    return texto ? (JSON.parse(texto) as Simulada) : null
  } catch {
    return null
  }
}

function tipoDoPlugin(tipo: BiometryType): TipoBiometria {
  if (tipo === BiometryType.faceId) return 'faceId'
  if (tipo === BiometryType.touchId) return 'touchId'
  if (tipo === BiometryType.fingerprintAuthentication) return 'digital'
  return 'biometria'
}

export async function verificar(): Promise<Aparelho> {
  if (!Capacitor.isNativePlatform()) {
    const s = simulada()
    if (!s) return { disponivel: false, tipo: 'biometria', motivo: 'outro' }
    if (s.indisponivel) return { disponivel: false, tipo: s.tipo, motivo: s.indisponivel === 'descadastrada' ? 'descadastrada' : 'outro' }
    return { disponivel: true, tipo: s.tipo }
  }
  try {
    const r = await BiometricAuth.checkBiometry()
    if (r.isAvailable) return { disponivel: true, tipo: tipoDoPlugin(r.biometryType) }
    // No iOS, a biometria bloqueada por tentativas também chega como indisponível: não é "descadastrada".
    const motivo = r.code === BiometryErrorType.biometryNotEnrolled ? 'descadastrada' : 'outro'
    return { disponivel: false, tipo: tipoDoPlugin(r.biometryType), motivo }
  } catch {
    return { disponivel: false, tipo: 'biometria', motivo: 'outro' }
  }
}

function resultadoDoErro(codigo: BiometryErrorType | undefined): ResultadoBiometria {
  switch (codigo) {
    case BiometryErrorType.authenticationFailed:
      return 'falhou'
    case BiometryErrorType.biometryLockout:
      return 'bloqueada'
    case BiometryErrorType.biometryNotAvailable:
    case BiometryErrorType.biometryNotEnrolled:
      return 'indisponivel'
    default:
      // userCancel, appCancel, systemCancel, userFallback...: não conta como falha.
      return 'cancelou'
  }
}

/** Pede a biometria uma vez. O PIN do aparelho não vale no lugar dela, para a regra das 3 falhas (HU-02.2). */
export async function autenticar(motivo: string): Promise<ResultadoBiometria> {
  if (!Capacitor.isNativePlatform()) {
    const s = simulada()
    if (!s) return 'indisponivel'
    if (s.indisponivel) return s.indisponivel === 'bloqueada' ? 'bloqueada' : 'indisponivel'
    const [proximo, ...resto] = s.proximos ?? []
    try {
      localStorage.setItem(SIMULADA, JSON.stringify({ ...s, proximos: resto }))
    } catch {
      // sem armazenamento, repete o mesmo resultado
    }
    return proximo ?? 'ok'
  }
  try {
    await BiometricAuth.authenticate({
      reason: motivo,
      cancelTitle: 'Cancelar',
      allowDeviceCredential: false,
      androidTitle: 'Desbloquear o Contadinho',
      androidConfirmationRequired: false,
    })
    return 'ok'
  } catch (e) {
    return resultadoDoErro(e instanceof BiometryError ? e.code : (e as { code?: BiometryErrorType })?.code)
  }
}

/** "o Face ID", "a digital": para frases como "Usar o Face ID para desbloquear?". */
export function nomeComArtigo(tipo: TipoBiometria): string {
  return { faceId: 'o Face ID', touchId: 'o Touch ID', digital: 'a digital', biometria: 'a biometria' }[tipo]
}

/** "Face ID", "digital": para botões como "Usar Face ID". */
export function nomeCurto(tipo: TipoBiometria): string {
  return { faceId: 'Face ID', touchId: 'Touch ID', digital: 'digital', biometria: 'biometria' }[tipo]
}

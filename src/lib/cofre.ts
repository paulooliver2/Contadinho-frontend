import { SecureStorage } from '@aparajita/capacitor-secure-storage'

const REFRESH = 'refresh-token'
const BIOMETRIA = 'biometria'
const EMAIL = 'email-conta'

export type EscolhaBiometria = 'ligada' | 'recusada'

/**
 * Refresh token no armazenamento seguro do aparelho: Keystore no Android, Keychain no iOS (HU-01.3).
 * No navegador (npm run dev) o plugin usa o localStorage, o que só serve para desenvolver.
 * HU-02: a escolha da biometria e o e-mail da conta, para conferir a senha antes de carregar a conta.
 */
export const cofre = {
  lerRefresh: () => SecureStorage.getItem(REFRESH),
  guardarRefresh: (token: string) => SecureStorage.setItem(REFRESH, token),
  apagarRefresh: () => SecureStorage.removeItem(REFRESH),
  lerBiometria: async (): Promise<EscolhaBiometria | null> => {
    const v = await SecureStorage.getItem(BIOMETRIA)
    return v === 'ligada' || v === 'recusada' ? v : null
  },
  guardarBiometria: (escolha: EscolhaBiometria) => SecureStorage.setItem(BIOMETRIA, escolha),
  lerEmail: () => SecureStorage.getItem(EMAIL),
  guardarEmail: (email: string) => SecureStorage.setItem(EMAIL, email),
  /** "Sair da conta" esquece a escolha e o e-mail neste aparelho. */
  apagarBiometria: async () => {
    await SecureStorage.removeItem(BIOMETRIA)
    await SecureStorage.removeItem(EMAIL)
  },
}

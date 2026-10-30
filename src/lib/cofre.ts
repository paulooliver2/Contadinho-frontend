import { SecureStorage } from '@aparajita/capacitor-secure-storage'

const REFRESH = 'refresh-token'

/**
 * Refresh token no armazenamento seguro do aparelho: Keystore no Android, Keychain no iOS (HU-01.3).
 * No navegador (npm run dev) o plugin usa o localStorage, o que só serve para desenvolver.
 */
export const cofre = {
  lerRefresh: () => SecureStorage.getItem(REFRESH),
  guardarRefresh: (token: string) => SecureStorage.setItem(REFRESH, token),
  apagarRefresh: () => SecureStorage.removeItem(REFRESH),
}

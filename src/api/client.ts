import createClient, { type Middleware } from 'openapi-fetch'
import { useSessao } from '@/stores/sessao'
import type { paths } from './schema'

/** Cliente tipado pelo contrato da API. Regere os tipos com `npm run gen:api` (RNF-07). */
export const api = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL })

const autenticacao: Middleware = {
  onRequest({ request }) {
    const token = useSessao().tokenAcesso
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
  onResponse({ response }) {
    if (response.status === 401) useSessao().sair()
    return response
  },
}

api.use(autenticacao)

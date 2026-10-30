import createClient from 'openapi-fetch'
import type { paths } from './schema'

/** Cliente sem token, para as rotas de /api/auth. A sessão usa este para não depender de si mesma. */
export const apiAberta = createClient<paths>({ baseUrl: import.meta.env.VITE_API_URL })

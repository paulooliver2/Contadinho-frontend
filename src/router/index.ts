import { createRouter, createWebHistory } from 'vue-router'
import { useSessao } from '@/stores/sessao'

declare module 'vue-router' {
  interface RouteMeta {
    /** Mostra a barra de abas. */
    abas?: boolean
    /** Tela de quem ainda não entrou (login, cadastro); quem já entrou vai para o Início. */
    publica?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/entrar', name: 'entrar', component: () => import('@/features/conta/EntrarView.vue'), meta: { publica: true } },
    { path: '/criar-conta', name: 'criar-conta', component: () => import('@/features/conta/CriarContaView.vue'), meta: { publica: true } },
    { path: '/recuperar-senha', name: 'recuperar-senha', component: () => import('@/features/conta/RecuperarSenhaView.vue'), meta: { publica: true } },
    { path: '/', name: 'inicio', component: () => import('@/features/inicio/InicioView.vue'), meta: { abas: true } },
    { path: '/gastos', name: 'gastos', component: () => import('@/features/gastos/GastosView.vue'), meta: { abas: true } },
    { path: '/cartoes', name: 'cartoes', component: () => import('@/features/cartoes/CartoesView.vue'), meta: { abas: true } },
    { path: '/receber', name: 'receber', component: () => import('@/features/receber/ReceberView.vue'), meta: { abas: true } },
    { path: '/:caminho(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const sessao = useSessao()
  // Na primeira navegação, tenta entrar com o refresh token guardado no aparelho.
  await sessao.restaurar()
  if (to.meta.publica) {
    if (sessao.logado) return { name: 'inicio' }
    return
  }
  if (!sessao.logado) {
    return to.fullPath === '/' ? { name: 'entrar' } : { name: 'entrar', query: { voltar: to.fullPath } }
  }
})

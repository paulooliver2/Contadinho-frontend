import { createRouter, createWebHistory } from 'vue-router'
import { useSessao } from '@/stores/sessao'

declare module 'vue-router' {
  interface RouteMeta {
    /** Mostra a barra de abas. */
    abas?: boolean
    /** Rota aberta sem login. */
    publica?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/entrar', name: 'entrar', component: () => import('@/features/conta/EntrarView.vue'), meta: { publica: true } },
    { path: '/', name: 'inicio', component: () => import('@/features/inicio/InicioView.vue'), meta: { abas: true } },
    { path: '/gastos', name: 'gastos', component: () => import('@/features/gastos/GastosView.vue'), meta: { abas: true } },
    { path: '/cartoes', name: 'cartoes', component: () => import('@/features/cartoes/CartoesView.vue'), meta: { abas: true } },
    { path: '/receber', name: 'receber', component: () => import('@/features/receber/ReceberView.vue'), meta: { abas: true } },
    { path: '/:caminho(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.publica && !useSessao().logado) {
    return { name: 'entrar', query: { voltar: to.fullPath } }
  }
})

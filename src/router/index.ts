import { createRouter, createWebHistory } from 'vue-router'
import { useSessao } from '@/stores/sessao'
import { useTrava } from '@/stores/trava'

declare module 'vue-router' {
  interface RouteMeta {
    /** Mostra a barra de abas. */
    abas?: boolean
    /**
     * Sem isto, a rota exige login.
     * - visitante: só para quem não entrou (login, cadastro); quem já entrou vai para o Início.
     * - livre: abre com ou sem login (link do e-mail de recuperação).
     */
    acesso?: 'visitante' | 'livre'
    /** Tela dentro de uma aba (o histórico da pessoa fica em A receber): a aba aparece marcada. */
    aba?: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/entrar', name: 'entrar', component: () => import('@/features/conta/EntrarView.vue'), meta: { acesso: 'visitante' } },
    { path: '/criar-conta', name: 'criar-conta', component: () => import('@/features/conta/CriarContaView.vue'), meta: { acesso: 'visitante' } },
    { path: '/recuperar-senha', name: 'recuperar-senha', component: () => import('@/features/conta/RecuperarSenhaView.vue'), meta: { acesso: 'visitante' } },
    { path: '/redefinir-senha', name: 'redefinir-senha', component: () => import('@/features/conta/RedefinirSenhaView.vue'), meta: { acesso: 'livre' } },
    { path: '/', name: 'inicio', component: () => import('@/features/inicio/InicioView.vue'), meta: { abas: true } },
    { path: '/gastos', name: 'gastos', component: () => import('@/features/gastos/GastosView.vue'), meta: { abas: true } },
    { path: '/cartoes', name: 'cartoes', component: () => import('@/features/cartoes/CartoesView.vue'), meta: { abas: true } },
    { path: '/receber', name: 'receber', component: () => import('@/features/receber/ReceberView.vue'), meta: { abas: true } },
    { path: '/receitas', name: 'receitas', component: () => import('@/features/receitas/ReceitasView.vue'), meta: { abas: true, aba: 'inicio' } },
    { path: '/configuracoes', name: 'configuracoes', component: () => import('@/features/conta/ConfiguracoesView.vue'), meta: { abas: true, aba: 'inicio' } },
    { path: '/avisos', name: 'avisos', component: () => import('@/features/avisos/AvisosView.vue'), meta: { abas: true, aba: 'inicio' } },
    { path: '/receber/:id', name: 'pessoa', component: () => import('@/features/receber/PessoaView.vue'), props: true, meta: { abas: true, aba: 'receber' } },
    { path: '/:caminho(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const sessao = useSessao()
  // Na primeira navegação, tenta entrar com o refresh token guardado no aparelho.
  await sessao.restaurar()
  // HU-02: decide o bloqueio antes da primeira tela, para nenhum valor aparecer antes.
  await useTrava().iniciar()
  if (to.meta.acesso === 'livre') return
  if (to.meta.acesso === 'visitante') {
    if (sessao.logado) return { name: 'inicio' }
    return
  }
  if (!sessao.logado) {
    return to.fullPath === '/' ? { name: 'entrar' } : { name: 'entrar', query: { voltar: to.fullPath } }
  }
})

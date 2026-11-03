<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CartaoAtalho from '@/components/CartaoAtalho.vue'
import { useAvisos } from '@/stores/avisos'
import { useConta } from '@/stores/conta'
import { useSessao } from '@/stores/sessao'
import ChavePixForm from './ChavePixForm.vue'
import ModeloCobrancaForm from './ModeloCobrancaForm.vue'

/**
 * Configurações: quem está logado, a chave Pix e o modelo da mensagem das cobranças (HU-03, HU-21), os avisos
 * (Épico 6) e Sair.
 */
const router = useRouter()
const conta = useConta()
const sessao = useSessao()
const erroCarga = ref('')
const erro = ref('')
const aviso = ref('')
const removendo = ref(false)

const iniciais = computed(() => {
  const partes = (conta.conta?.nome ?? '').split(/\s+/).filter(Boolean)
  const letras = partes.length > 1 ? partes[0]![0]! + partes[partes.length - 1]![0]! : (partes[0] ?? '').slice(0, 2)
  return letras.toUpperCase()
})

async function carregar() {
  erroCarga.value = ''
  try {
    await conta.carregar()
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  }
}

const avisos = useAvisos()
const estadoAvisos = computed(
  () => ({ concedida: 'ligados', negada: 'bloqueados', perguntar: 'desligados', indisponivel: 'indisponíveis' })[avisos.permissao ?? 'perguntar'],
)

onMounted(() => {
  carregar()
  avisos.lerPermissao().catch(() => undefined)
})

async function removerPix() {
  if (removendo.value) return
  removendo.value = true
  erro.value = ''
  aviso.value = ''
  try {
    await conta.removerPix()
    aviso.value = 'Chave removida. Para cobrar pelo WhatsApp, cadastre outra.'
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    removendo.value = false
  }
}

async function sair() {
  await sessao.sair()
  await router.replace({ name: 'entrar' })
}
</script>

<template>
  <div class="tela">
    <header class="cabecalho">
      <BotaoVoltar :para="{ name: 'inicio' }" rotulo="Voltar para o Início" />
      <h1>Configurações</h1>
    </header>

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="conta.conta">
      <section class="cartao perfil" aria-label="Sua conta">
        <span class="iniciais" aria-hidden="true">{{ iniciais }}</span>
        <span class="textos">
          <span class="nome">{{ conta.conta.nome }}</span>
          <span class="email">{{ conta.conta.email }}</span>
        </span>
      </section>

      <h2>Cobrança</h2>
      <section class="cartao" aria-labelledby="titulo-pix">
        <h3 id="titulo-pix">Chave Pix</h3>
        <p class="ajuda">Entra sozinha em toda mensagem de cobrança.</p>
        <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />
        <ChavePixForm @salva="aviso = ''" />
        <CaixaAviso :mensagem="erro" />
        <button v-if="conta.conta.pix" type="button" class="remover" :disabled="removendo" @click="removerPix">
          {{ removendo ? 'Removendo…' : 'Remover chave' }}
        </button>
      </section>
      <section class="cartao" aria-labelledby="titulo-modelo">
        <h3 id="titulo-modelo">Mensagem de cobrança</h3>
        <p class="ajuda">O texto que vai no WhatsApp. Escreva do seu jeito e use as variáveis para o que muda.</p>
        <ModeloCobrancaForm />
      </section>

      <h2>Avisos</h2>
      <CartaoAtalho titulo="Avisos" :detalhe="estadoAvisos" :para="{ name: 'avisos' }">
        <span class="ajuda">Vencimento das contas fixas, fechamento das faturas e quem ainda deve.</span>
      </CartaoAtalho>

      <BotaoAcao variante="secundario" @click="sair">Sair</BotaoAcao>
    </template>

    <p v-else class="carregando" role="status">Carregando…</p>
  </div>
</template>

<style scoped>
.tela {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cabecalho {
  display: flex;
  align-items: center;
  gap: 4px;
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

h2 {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rotulo);
}

h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.cartao {
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--superficie);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.perfil {
  flex-direction: row;
  align-items: center;
}

.iniciais {
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--marca-clara);
  color: var(--marca-escura);
  font-weight: 700;
  display: grid;
  place-items: center;
}

.textos {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nome {
  font-size: 16px;
  font-weight: 700;
}

.email {
  font-size: 13px;
  color: var(--texto-suave);
  overflow: hidden;
  text-overflow: ellipsis;
}

.ajuda {
  margin: -8px 0 0;
  font-size: 13px;
  color: var(--texto-suave);
}

.remover {
  align-self: center;
  min-height: var(--toque-minimo);
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--texto-suave);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  text-align: center;
}
</style>

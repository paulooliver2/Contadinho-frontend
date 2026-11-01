<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { diaMesCurto } from '@/lib/formatos'
import { useAvisos } from '@/stores/avisos'

/**
 * Avisos (Épico 6): se o celular deixa avisar e, se não deixa, como reativar (HU-25.2). Com permissão, os próximos
 * avisos agendados.
 */
const avisos = useAvisos()
const erro = ref('')
const pedindo = ref(false)
const noCelular = Capacitor.isNativePlatform()

async function atualizar() {
  erro.value = ''
  try {
    await avisos.reagendar()
  } catch (e) {
    erro.value = mensagemDeErro(e)
  }
}

onMounted(atualizar)

async function permitir() {
  pedindo.value = true
  try {
    await avisos.permitir()
  } finally {
    pedindo.value = false
  }
}

const proximos = computed(() =>
  avisos.agendados.map((a) => ({ ...a, dia: `${diaMesCurto(a.quando.slice(0, 10))} às ${Number(a.quando.slice(11, 13))}h` })),
)
</script>

<template>
  <div class="tela">
    <header class="cabecalho">
      <BotaoVoltar :para="{ name: 'configuracoes' }" rotulo="Voltar para Configurações" />
      <h1>Avisos</h1>
    </header>

    <section class="cartao" aria-labelledby="titulo-estado">
      <template v-if="avisos.permissao === 'concedida'">
        <h2 id="titulo-estado">Avisos ligados</h2>
        <p class="texto">O Contadinho avisa 2 dias antes e no dia do vencimento de cada conta fixa, às 9h, quando cada fatura fecha e, 3 dias antes de ela vencer, se alguém ainda deve a parte dela.</p>
      </template>
      <template v-else-if="avisos.permissao === 'negada'">
        <h2 id="titulo-estado">Avisos bloqueados no celular</h2>
        <p class="texto">Você não permitiu os avisos, e o celular não pergunta de novo. Para ligar:</p>
        <ol class="passos">
          <li>Abra as Configurações do celular.</li>
          <li>Toque em Apps e depois em Contadinho.</li>
          <li>Em Notificações, ative "Permitir notificações".</li>
        </ol>
        <BotaoAcao variante="secundario" @click="atualizar">Já ativei</BotaoAcao>
      </template>
      <template v-else-if="avisos.permissao === 'indisponivel'">
        <h2 id="titulo-estado">Avisos indisponíveis</h2>
        <p class="texto">Este navegador não mostra avisos. Eles chegam pelo app do Contadinho no celular.</p>
      </template>
      <template v-else-if="avisos.permissao === 'perguntar'">
        <h2 id="titulo-estado">Avisos desligados</h2>
        <p class="texto">Ligue para ser avisado 2 dias antes e no dia do vencimento de cada conta fixa, às 9h, quando cada fatura fecha e, 3 dias antes de ela vencer, se alguém ainda deve a parte dela.</p>
        <BotaoAcao :carregando="pedindo" texto-carregando="Pedindo…" @click="permitir">Ativar avisos</BotaoAcao>
      </template>
      <p v-else class="texto" role="status">Carregando…</p>
    </section>

    <CaixaAviso :mensagem="erro" />

    <template v-if="avisos.permissao === 'concedida'">
      <h2 class="secao">Próximos avisos</h2>
      <ul v-if="proximos.length" class="lista" aria-label="Próximos avisos">
        <li v-for="a in proximos" :key="a.chave">
          <span class="titulo">{{ a.titulo }}</span>
          <span class="quando">{{ a.dia }}</span>
        </li>
      </ul>
      <p v-else class="texto vazio">Nenhum aviso nos próximos 60 dias.</p>
      <TextoAjuda v-if="!noCelular">No navegador, os avisos não ficam agendados: eles chegam pelo app no celular.</TextoAjuda>
    </template>
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

.cartao {
  padding: 16px;
  border-radius: var(--raio-card);
  background: var(--superficie);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cartao h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.texto {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.passos {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
  line-height: 1.6;
}

.secao {
  margin: 8px 0 0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--rotulo);
}

.lista {
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--raio-card);
  background: var(--superficie);
  overflow: hidden;
}

.lista li {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
}

.lista li + li {
  border-top: 1px solid var(--divisoria);
}

.quando {
  color: var(--texto-suave);
  white-space: nowrap;
}

.vazio {
  color: var(--texto-suave);
}
</style>

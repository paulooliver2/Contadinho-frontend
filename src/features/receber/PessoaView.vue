<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import BotaoVoltar from '@/components/BotaoVoltar.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CartaoResumo from '@/components/CartaoResumo.vue'
import EstadoVazio from '@/components/EstadoVazio.vue'
import IconeCartao from '@/components/IconeCartao.vue'
import LinhaLancamento from '@/features/cartoes/LinhaLancamento.vue'
import { mesPorExtenso, reais } from '@/lib/formatos'
import { formatarWhatsapp } from '@/lib/telefone'
import { usePessoas } from '@/stores/pessoas'
import LinhaPagamento from './LinhaPagamento.vue'
import PagamentoFolha from './PagamentoFolha.vue'
import PessoaFolha from './PessoaFolha.vue'
import { buscarHistorico, desfazerPagamento, type CompraAtribuida, type Historico } from './receber'
import SeloStatus from './SeloStatus.vue'

/**
 * HU-18.3: o saldo da pessoa e o histórico do que ela deve, fatura por fatura, com os pagamentos (HU-19). Daqui
 * também se edita a pessoa.
 */
const props = defineProps<{ id: string }>()

const router = useRouter()
const pessoas = usePessoas()
const historico = ref<Historico | null>(null)
const erroCarga = ref('')
const aviso = ref('')
const folhaAberta = ref(false)
const pagamentoAberto = ref(false)
const desfazendo = ref<string | null>(null)
const erroDesfazer = ref('')

const pessoa = computed(() => [...pessoas.ativas, ...pessoas.arquivadas].find((p) => p.id === props.id) ?? null)

async function carregar() {
  erroCarga.value = ''
  try {
    const [lido] = await Promise.all([buscarHistorico(props.id), pessoas.carregado ? null : pessoas.carregar()])
    historico.value = lido
  } catch (e) {
    erroCarga.value = mensagemDeErro(e)
  }
}

watch(() => props.id, carregar, { immediate: true })

/** As compras vêm da fatura mais recente para a mais antiga; aqui ficam juntas por fatura e cartão. */
const grupos = computed(() => {
  const lista: { chave: string; titulo: string; compras: CompraAtribuida[] }[] = []
  for (const c of historico.value?.compras ?? []) {
    const chave = `${c.fatura}|${c.cartao}`
    const grupo = lista.find((g) => g.chave === chave)
    if (grupo) grupo.compras.push(c)
    else lista.push({ chave, titulo: `Fatura de ${mesPorExtenso(c.fatura).toLowerCase()} · ${c.cartao}`, compras: [c] })
  }
  return lista
})

// Excluída: não há mais o que mostrar aqui. Vigia a lista, porque a folha some junto com a pessoa antes de avisar.
watch(pessoa, (atual, anterior) => {
  if (anterior && !atual) router.replace({ name: 'receber' })
})

function aoSalvar(mensagem: string) {
  aviso.value = mensagem
  carregar()
}

/** RN-30: a compra já quitada pelos pagamentos fica "paga"; a quitada em parte mostra o que falta. */
function seloDa(c: CompraAtribuida): string | undefined {
  if (c.valor <= 0) return undefined
  if (c.emAberto === 0) return 'paga'
  return c.emAberto < c.valor ? `falta ${reais(c.emAberto)}` : undefined
}

async function desfazer(id: string) {
  if (desfazendo.value) return
  desfazendo.value = id
  erroDesfazer.value = ''
  try {
    await desfazerPagamento(id)
    aviso.value = 'Pagamento desfeito. O saldo foi recalculado.'
    await carregar()
  } catch (e) {
    erroDesfazer.value = mensagemDeErro(e)
  } finally {
    desfazendo.value = null
  }
}
</script>

<template>
  <div class="tela">
    <BotaoVoltar :para="{ name: 'receber' }" rotulo="Voltar para A receber" />

    <template v-if="erroCarga">
      <CaixaAviso :mensagem="erroCarga" />
      <BotaoAcao variante="secundario" @click="carregar">Tentar de novo</BotaoAcao>
    </template>

    <template v-else-if="historico && pessoa">
      <header class="cabecalho">
        <div>
          <h1>{{ pessoa.nome }}</h1>
          <p class="contato">
            {{ pessoa.whatsapp ? formatarWhatsapp(pessoa.whatsapp) : 'sem WhatsApp' }}
            <template v-if="pessoa.arquivada"> · arquivada</template>
          </p>
        </div>
        <button type="button" class="editar" @click="folhaAberta = true">Editar</button>
      </header>

      <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />

      <CartaoResumo rotulo="Saldo a receber" :valor="reais(historico.situacao.saldo)" nome="Saldo da pessoa">
        <p class="linha-resumo">
          De {{ reais(historico.situacao.original) }} · recebido {{ reais(historico.situacao.recebido) }}
          <SeloStatus :status="historico.situacao.status" />
        </p>
      </CartaoResumo>

      <BotaoAcao v-if="historico.situacao.saldo > 0" @click="pagamentoAberto = true">Marcar como pago</BotaoAcao>
      <p v-else-if="historico.situacao.saldo < 0" class="credito">
        {{ pessoa.apelido ?? pessoa.nome }} tem {{ reais(-historico.situacao.saldo) }} de crédito: ele abate as próximas compras.
      </p>

      <section v-for="g in grupos" :key="g.chave" class="grupo" :aria-label="g.titulo">
        <h2>{{ g.titulo }}</h2>
        <ul class="lista">
          <LinhaLancamento v-for="c in g.compras" :key="c.lancamentoId" :item="c" :selo="seloDa(c)" />
        </ul>
      </section>

      <section v-if="historico.pagamentos.length > 0" class="grupo" aria-label="Pagamentos recebidos">
        <h2>Pagamentos recebidos</h2>
        <CaixaAviso :mensagem="erroDesfazer" />
        <ul class="lista">
          <LinhaPagamento
            v-for="p in historico.pagamentos"
            :key="p.id"
            :pagamento="p"
            :desfazendo="desfazendo === p.id"
            @desfazer="desfazer(p.id)"
          />
        </ul>
      </section>

      <EstadoVazio
        v-if="grupos.length === 0 && historico.pagamentos.length === 0"
        titulo="Nada registrado ainda"
        :texto="`Na aba Cartões, toque no responsável de uma compra da fatura e escolha ${pessoa.apelido ?? pessoa.nome}.`"
      >
        <template #icone><IconeCartao :tamanho="28" /></template>
      </EstadoVazio>

      <PessoaFolha v-model:aberta="folhaAberta" :editando="pessoa" @salvo="aoSalvar" />
      <PagamentoFolha
        v-model:aberta="pagamentoAberto"
        :pessoa-id="pessoa.id"
        :nome="pessoa.apelido ?? pessoa.nome"
        :saldo="historico.situacao.saldo"
        @salvo="aoSalvar"
      />
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
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.contato {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--texto-suave);
}

.editar {
  min-height: var(--toque-minimo);
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--marca);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.linha-resumo {
  font-size: 12px;
  color: var(--escuro-texto-suave);
  display: flex;
  align-items: center;
  gap: 8px;
}

.grupo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

h2 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rotulo);
}

.lista {
  margin: 0;
  padding: 0;
  border-radius: var(--raio-card);
  background: var(--superficie);
  overflow: hidden;
}

.credito {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
}

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
  text-align: center;
}
</style>

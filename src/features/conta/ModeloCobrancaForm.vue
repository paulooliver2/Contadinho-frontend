<script setup lang="ts">
import { computed, ref } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoAreaTexto from '@/components/CampoAreaTexto.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import BalaoMensagem from '@/features/receber/BalaoMensagem.vue'
import { aplicarModelo, MODELO_INICIAL, problemasDoModelo, VARIAVEIS, type DadosCobranca } from '@/features/receber/cobranca'
import { useConta } from '@/stores/conta'

/**
 * HU-21: o texto da cobrança do WhatsApp com {nome}, {valor}, {vencimento}, {pix} e {detalhe}, e a prévia ao vivo
 * com um exemplo de duas origens. Variável desconhecida não salva; sem {detalhe}, só avisa.
 */
const conta = useConta()

const modelo = ref(conta.conta?.modeloCobranca ?? MODELO_INICIAL)
const campo = ref<InstanceType<typeof CampoAreaTexto> | null>(null)
const erroCampo = ref('')
const erro = ref('')
const aviso = ref('')
const enviando = ref(false)

/** A prévia usa a chave do dono, quando há; o resto é exemplo. */
const exemplo = computed<DadosCobranca>(() => ({
  nome: 'Lucas',
  total: 342.55,
  vencimento: '2026-12-08',
  pix: conta.conta?.pix ?? { tipo: 'EMAIL', chave: 'voce@email.com' },
  origens: [
    { tipo: 'CARTAO', nome: 'cartão Itaú', valor: 42.55 },
    { tipo: 'EMPRESTIMO', nome: 'empréstimo (conserto do carro)', valor: 300 },
  ],
}))

/** "nome" vira "{nome}". */
const chave = (v: string) => `{${v}}`

const problemas = computed(() => problemasDoModelo(modelo.value))
/** O que impede salvar vira o erro do campo, para o leitor de tela dizer por que o botão está desativado. */
const erroDoModelo = computed(() => {
  if (problemas.value.desconhecidas.length) {
    return `Não conheço ${problemas.value.desconhecidas.join(', ')}. Use {nome}, {valor}, {vencimento}, {pix} ou {detalhe}.`
  }
  return problemas.value.semPar ? 'Feche cada variável com { e }, como {nome}.' : ''
})
const bloqueia = computed(() => erroDoModelo.value !== '')
const previa = computed(() => aplicarModelo(modelo.value, exemplo.value))

async function salvarTexto(texto: string, sucesso: string) {
  if (enviando.value) return
  enviando.value = true
  erro.value = ''
  erroCampo.value = ''
  aviso.value = ''
  try {
    const salvo = await conta.salvarModeloCobranca(texto)
    modelo.value = salvo ?? MODELO_INICIAL
    aviso.value = sucesso
  } catch (e) {
    if (e instanceof ErroApi && e.campos.modelo) erroCampo.value = e.campos.modelo
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="modelo">
    <CampoAreaTexto ref="campo" v-model="modelo" rotulo="Modelo da mensagem" :maxlength="1000" :linhas="6" :erro="erroDoModelo || erroCampo" />
    <div class="variaveis" role="group" aria-label="Inserir variável">
      <button v-for="v in VARIAVEIS" :key="v" type="button" class="variavel" @click="campo?.inserir(chave(v))">{{ chave(v) }}</button>
    </div>

    <TextoAjuda v-if="!erroDoModelo && problemas.semDetalhe" tom="aviso">
      Sem {detalhe}, quem deve em mais de um cartão ou empréstimo vai ver só o total.
    </TextoAjuda>

    <p class="rotulo-previa">Como fica, num exemplo:</p>
    <BalaoMensagem :texto="previa" rotulo="Prévia do modelo" />

    <CaixaAviso v-if="aviso" tom="sucesso" fechavel :mensagem="aviso" @fechar="aviso = ''" />
    <CaixaAviso :mensagem="erro" />
    <BotaoAcao :desativado="bloqueia" :carregando="enviando" texto-carregando="Salvando…" @click="salvarTexto(modelo, 'Modelo salvo.')">
      Salvar modelo
    </BotaoAcao>
    <button
      v-if="conta.conta?.modeloCobranca"
      type="button"
      class="padrao"
      :disabled="enviando"
      @click="salvarTexto('', 'Voltou ao texto padrão.')"
    >
      Voltar ao texto padrão
    </button>
  </div>
</template>

<style scoped>
.modelo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variaveis {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: -4px;
}

.variavel {
  min-height: 36px;
  padding: 0 10px;
  border: 1px solid var(--borda);
  border-radius: 18px;
  background: var(--superficie);
  color: var(--marca-escura);
  font-family: var(--fonte-numeros);
  font-size: 13px;
  cursor: pointer;
}

.rotulo-previa {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
}

.padrao {
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
</style>

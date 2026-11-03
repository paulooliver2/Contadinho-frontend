<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import type { Cartao } from '@/stores/cartoes'
import { usePessoas } from '@/stores/pessoas'
import { buscarAdicionais, cadastrarAdicional, removerAdicional, type Adicionais } from './adicionais'
import AvisoFinalDoCartao from './AvisoFinalDoCartao.vue'

/**
 * HU-38: os adicionais do cartão, cada um com a pessoa que o usa. As compras feitas nele chegam atribuídas a ela na
 * importação, quando o arquivo traz o final do cartão (RN-19); se não traz, o aviso diz (HU-38.3).
 */
const props = defineProps<{ cartao: Cartao }>()
const aberta = defineModel<boolean>('aberta', { required: true })

const pessoas = usePessoas()
const dados = ref<Adicionais | null>(null)
const ultimos4 = ref('')
const pessoaId = ref<string | null>(null)
const erros = useErrosDeCampos({ ultimos4, pessoaId })
const erro = ref('')
const mensagem = ref('')
const enviando = ref(false)

watch(aberta, async (abriu) => {
  if (!abriu) return
  dados.value = null
  ultimos4.value = ''
  pessoaId.value = null
  erros.value = {}
  erro.value = ''
  mensagem.value = ''
  try {
    if (!pessoas.carregado) await pessoas.carregar()
    dados.value = await buscarAdicionais(props.cartao.id)
  } catch (e) {
    erro.value = mensagemDeErro(e)
  }
})

const opcoes = computed(() => pessoas.ativas.map((p) => ({ valor: p.id, rotulo: p.apelido ?? p.nome })))

async function cadastrar() {
  if (enviando.value) return
  const novos: Record<string, string> = {}
  if (!/^\d{4}$/.test(ultimos4.value)) novos.ultimos4 = 'Informe os 4 últimos dígitos do adicional.'
  if (!pessoaId.value) novos.pessoaId = 'Escolha de quem é o adicional.'
  erros.value = novos
  if (Object.keys(novos).length > 0) return
  enviando.value = true
  erro.value = ''
  mensagem.value = ''
  try {
    const novo = await cadastrarAdicional(props.cartao.id, ultimos4.value, pessoaId.value!)
    dados.value = await buscarAdicionais(props.cartao.id)
    mensagem.value = `Adicional •• ${novo.ultimos4} é de ${pessoas.rotulo(novo.pessoaId)}.`
    ultimos4.value = ''
    pessoaId.value = null
  } catch (e) {
    if (e instanceof ErroApi && Object.keys(e.campos).length > 0) erros.value = e.campos
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}

async function remover(id: string, final: string) {
  if (enviando.value) return
  enviando.value = true
  erro.value = ''
  mensagem.value = ''
  try {
    await removerAdicional(props.cartao.id, id)
    dados.value = await buscarAdicionais(props.cartao.id)
    mensagem.value = `Adicional •• ${final} removido.`
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" titulo="Cartões adicionais">
    <div v-if="dados" class="conteudo">
      <AvisoFinalDoCartao :traz-final="dados.trazFinal" :banco="cartao.banco" />

      <ul v-if="dados.adicionais.length > 0" class="lista" aria-label="Adicionais cadastrados">
        <li v-for="a in dados.adicionais" :key="a.id">
          <span class="textos">
            <span class="final">•• {{ a.ultimos4 }}</span>
            <span class="pessoa">{{ pessoas.rotulo(a.pessoaId) }}</span>
          </span>
          <button
            type="button"
            class="remover"
            :disabled="enviando"
            :aria-label="`Remover adicional ${a.ultimos4}`"
            @click="remover(a.id, a.ultimos4)"
          >
            Remover
          </button>
        </li>
      </ul>

      <CaixaAviso v-if="mensagem" tom="sucesso" :mensagem="mensagem" />

      <template v-if="pessoas.ativas.length === 0">
        <TextoAjuda>Para cadastrar um adicional, cadastre antes em A receber a pessoa que usa o cartão.</TextoAjuda>
        <BotaoAcao variante="secundario" para="/receber">Cadastrar pessoas</BotaoAcao>
      </template>
      <FormularioEmpilhado v-else @enviar="cadastrar">
        <h3>Novo adicional</h3>
        <CampoTexto
          v-model="ultimos4"
          rotulo="Final do adicional"
          placeholder="0000"
          numerico
          :maxlength="4"
          autocomplete="off"
          :erro="erros.ultimos4"
        />
        <ChipsEscolha v-model="pessoaId" rotulo="De quem é" :opcoes="opcoes" :erro="erros.pessoaId" />
        <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Salvando…">Salvar adicional</BotaoAcao>
        <TextoAjuda>Vale para as próximas importações; as compras já importadas não mudam.</TextoAjuda>
      </FormularioEmpilhado>

      <CaixaAviso :mensagem="erro" />
    </div>
    <template v-else>
      <CaixaAviso v-if="erro" :mensagem="erro" />
      <p v-else class="carregando" role="status">Carregando…</p>
    </template>
  </FolhaInferior>
</template>

<style scoped>
.conteudo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h3 {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 700;
}

.lista {
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--raio-card);
  border: 1px solid var(--divisoria);
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 4px 6px 16px;
}

li + li {
  border-top: 1px solid var(--divisoria);
}

.textos {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.final {
  font-family: var(--fonte-numeros);
  font-size: 14px;
}

.pessoa {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remover {
  flex: none;
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

.carregando {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
}
</style>

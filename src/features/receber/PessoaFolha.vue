<script setup lang="ts">
import { ref, watch } from 'vue'
import { ErroApi, mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import CampoTexto from '@/components/CampoTexto.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import FormularioEmpilhado from '@/components/FormularioEmpilhado.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import { escolherContato, podeEscolherContato } from '@/lib/contatos'
import { useErrosDeCampos } from '@/lib/errosDeCampos'
import { formatarWhatsapp, normalizarWhatsapp } from '@/lib/telefone'
import { usePessoas, type DadosPessoa, type Pessoa } from '@/stores/pessoas'

/** HU-16: cadastrar ou editar uma pessoa. Na edição, também arquivar, desarquivar e excluir (HU-42). */
const props = defineProps<{ editando: Pessoa | null }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ salvo: [mensagem: string] }>()

const pessoas = usePessoas()
const comContatos = podeEscolherContato()

const WHATSAPP_INVALIDO = 'Informe DDD e número, como (61) 99999-8888.'

const nome = ref('')
const apelido = ref('')
const whatsapp = ref('')
const erros = useErrosDeCampos({ nome, apelido, whatsapp })
const erro = ref('')
const enviando = ref(false)
const confirmandoExclusao = ref(false)

watch(aberta, (abriu) => {
  if (!abriu) return
  const p = props.editando
  nome.value = p?.nome ?? ''
  apelido.value = p?.apelido ?? ''
  whatsapp.value = p?.whatsapp ? formatarWhatsapp(p.whatsapp) : ''
  erros.value = {}
  erro.value = ''
  confirmandoExclusao.value = false
})

async function doContato() {
  erro.value = ''
  try {
    const contato = await escolherContato()
    if (contato.nome) nome.value = contato.nome.slice(0, 80)
    const numero = normalizarWhatsapp(contato.numero)
    whatsapp.value = numero ? formatarWhatsapp(numero) : contato.numero
    if (!numero) erros.value = { ...erros.value, whatsapp: contato.numero ? WHATSAPP_INVALIDO : 'Esse contato não tem telefone. Digite o número.' }
  } catch {
    erro.value = 'Sem acesso aos contatos. Digite o número ou libere a permissão de contatos nas configurações do celular.'
  }
}

/** As mesmas regras do servidor (RN-35), para avisar antes de enviar. */
function montar(): DadosPessoa | null {
  const novos: Record<string, string> = {}
  if (!nome.value.trim()) novos.nome = 'Informe o nome.'
  const numero = whatsapp.value.trim() ? normalizarWhatsapp(whatsapp.value) : null
  if (whatsapp.value.trim() && !numero) novos.whatsapp = WHATSAPP_INVALIDO
  erros.value = novos
  if (Object.keys(novos).length > 0) return null
  return { nome: nome.value.trim(), apelido: apelido.value.trim(), whatsapp: numero ?? '' }
}

/** Roda uma ação da folha: um toque por vez, e o erro aparece na própria folha. */
async function executar(acao: () => Promise<string>) {
  if (enviando.value) return
  enviando.value = true
  erro.value = ''
  try {
    emit('salvo', await acao())
    aberta.value = false
  } catch (e) {
    if (e instanceof ErroApi && Object.keys(e.campos).length > 0) erros.value = e.campos
    else erro.value = mensagemDeErro(e)
  } finally {
    enviando.value = false
    confirmandoExclusao.value = false
  }
}

function salvar() {
  const dados = montar()
  if (!dados) return
  const editando = props.editando
  executar(async () => {
    if (!editando) return `Pessoa cadastrada: ${(await pessoas.cadastrar(dados)).nome}.`
    await pessoas.alterar(editando.id, dados)
    return 'Dados salvos.'
  })
}

function alternarArquivo() {
  const p = props.editando
  if (!p) return
  executar(async () => {
    if (p.arquivada) return `${(await pessoas.desarquivar(p.id)).nome} voltou para a lista.`
    return `${(await pessoas.arquivar(p.id)).nome} foi para as arquivadas. O histórico continua guardado.`
  })
}

function excluir() {
  const p = props.editando
  if (!p || enviando.value) return
  if (!confirmandoExclusao.value) {
    confirmandoExclusao.value = true
    return
  }
  executar(async () => {
    await pessoas.excluir(p.id)
    return `Pessoa excluída: ${p.nome}.`
  })
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="editando ? 'Editar pessoa' : 'Nova pessoa'">
    <FormularioEmpilhado @enviar="salvar">
      <BotaoAcao v-if="comContatos" variante="secundario" :desativado="enviando" @click="doContato">
        Escolher dos contatos do celular
      </BotaoAcao>

      <CampoTexto v-model="nome" rotulo="Nome" placeholder="Ex.: Lucas Andrade" :maxlength="80" autocomplete="off" :erro="erros.nome" />
      <CampoTexto v-model="apelido" rotulo="Apelido (opcional)" placeholder="Ex.: Lu" :maxlength="40" autocomplete="off" :erro="erros.apelido" />
      <CampoTexto v-model="whatsapp" rotulo="WhatsApp (opcional)" tipo="tel" placeholder="(61) 99999-8888" :maxlength="30" autocomplete="off" :erro="erros.whatsapp" />

      <TextoAjuda>O WhatsApp é usado para mandar a cobrança. {{ comContatos ? 'O app lê só o contato que você escolher, nunca a agenda inteira.' : '' }}</TextoAjuda>

      <CaixaAviso :mensagem="erro" />

      <BotaoAcao tipo="submit" :carregando="enviando" texto-carregando="Salvando…">
        {{ editando ? 'Salvar' : 'Cadastrar pessoa' }}
      </BotaoAcao>
      <template v-if="editando">
        <BotaoAcao variante="secundario" :desativado="enviando" @click="alternarArquivo">
          {{ editando.arquivada ? 'Desarquivar' : 'Arquivar pessoa' }}
        </BotaoAcao>
        <BotaoAcao variante="secundario" :desativado="enviando" @click="excluir">
          {{ confirmandoExclusao ? 'Toque de novo para excluir' : 'Excluir pessoa' }}
        </BotaoAcao>
        <TextoAjuda v-if="!editando.arquivada">Arquivar tira a pessoa das listas de escolha e guarda o histórico. Dá para desarquivar quando quiser.</TextoAjuda>
      </template>
    </FormularioEmpilhado>
  </FolhaInferior>
</template>

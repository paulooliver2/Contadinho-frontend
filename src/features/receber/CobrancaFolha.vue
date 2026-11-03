<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mensagemDeErro } from '@/api/erros'
import BotaoAcao from '@/components/BotaoAcao.vue'
import CaixaAviso from '@/components/CaixaAviso.vue'
import FolhaInferior from '@/components/FolhaInferior.vue'
import TextoAjuda from '@/components/TextoAjuda.vue'
import ChavePixForm from '@/features/conta/ChavePixForm.vue'
import { formatarWhatsapp } from '@/lib/telefone'
import { useConta } from '@/stores/conta'
import type { Pessoa } from '@/stores/pessoas'
import BalaoMensagem from './BalaoMensagem.vue'
import { linkWhatsapp, mensagemDeCobranca, registrarCobranca } from './cobranca'
import type { Historico } from './receber'

/**
 * HU-20: a prévia da cobrança e o botão que abre o WhatsApp da pessoa com o texto pronto. O envio é sempre do dono
 * (RN-34). Sem chave Pix, pede a chave antes de montar a mensagem (RN-06, HU-03.2).
 */
const props = defineProps<{ pessoa: Pessoa; historico: Historico }>()
const aberta = defineModel<boolean>('aberta', { required: true })
const emit = defineEmits<{ cobrado: [] }>()

const conta = useConta()
const carregando = ref(false)
const erro = ref('')
const enviando = ref(false)

watch(aberta, async (abriu) => {
  if (!abriu) return
  erro.value = ''
  if (conta.conta) return
  carregando.value = true
  try {
    await conta.carregar()
  } catch (e) {
    erro.value = mensagemDeErro(e)
  } finally {
    carregando.value = false
  }
})

const nome = computed(() => props.pessoa.apelido ?? props.pessoa.nome.split(' ')[0]!)
const pix = computed(() => conta.conta?.pix ?? null)
const mensagem = computed(() => (pix.value ? mensagemDeCobranca(nome.value, props.historico, pix.value, conta.conta?.modeloCobranca) : ''))

async function abrirWhatsapp() {
  const numero = props.pessoa.whatsapp
  if (!numero || !mensagem.value || enviando.value) return
  // Abre antes de esperar o servidor: depois de um await, o navegador pode bloquear a janela nova.
  window.open(linkWhatsapp(numero, mensagem.value), '_blank')
  enviando.value = true
  erro.value = ''
  try {
    await registrarCobranca(props.pessoa.id)
    emit('cobrado')
    aberta.value = false
  } catch (e) {
    erro.value = `O WhatsApp abriu, mas a cobrança não ficou registrada: ${mensagemDeErro(e)}`
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <FolhaInferior v-model:aberta="aberta" :titulo="`Cobrar ${nome}`">
    <div class="conteudo">
      <p v-if="pessoa.whatsapp" class="numero">WhatsApp {{ formatarWhatsapp(pessoa.whatsapp) }}</p>

      <p v-if="carregando" class="numero" role="status">Carregando…</p>

      <template v-else-if="conta.conta && !pix">
        <p class="pedido">Para cobrar, cadastre sua chave Pix. Ela entra sozinha em toda mensagem.</p>
        <ChavePixForm />
      </template>

      <template v-else-if="pix">
        <BalaoMensagem :texto="mensagem" rotulo="Prévia da mensagem" />
        <TextoAjuda>
          O WhatsApp abre nessa conversa com o texto pronto. Você confere e toca em enviar. A chave Pix vem das suas
          configurações.
        </TextoAjuda>
        <BotaoAcao :carregando="enviando" texto-carregando="Registrando…" @click="abrirWhatsapp">Abrir no WhatsApp</BotaoAcao>
      </template>

      <CaixaAviso :mensagem="erro" />
    </div>
  </FolhaInferior>
</template>

<style scoped>
.conteudo {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.numero {
  margin: -10px 0 0;
  font-size: 13px;
  color: var(--texto-suave);
}

.pedido {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

</style>

<script setup lang="ts">
import { computed } from 'vue'
import CartaoAtalho from '@/components/CartaoAtalho.vue'
import IniciaisPessoa from '@/components/IniciaisPessoa.vue'
import { reais } from '@/lib/formatos'
import { usePessoas } from '@/stores/pessoas'
import type { Proximos } from './resumo'

/** HU-24.2: quanto as pessoas ainda devem e quem. Leva a A receber. */
const props = defineProps<{ aReceber: Proximos['aReceber'] }>()

const pessoas = usePessoas()

const MOSTRADAS = 3

const devedores = computed(() => props.aReceber.devedores.map((d) => ({ ...d, nome: pessoas.rotulo(d.pessoaId) })))

const detalhe = computed(() => {
  const partes = [`de ${reais(props.aReceber.original)}`]
  const pagaram = devedores.value.filter((d) => d.pagouParte)
  if (pagaram.length === 1) partes.push(`${pagaram[0]!.nome} já pagou parte`)
  else if (pagaram.length > 1) partes.push(`${pagaram.length} pessoas já pagaram parte`)
  return partes.join(' · ')
})

const quem = computed(() => devedores.value.map((d) => d.nome).join(', '))
</script>

<template>
  <CartaoAtalho titulo="A receber" :para="{ name: 'receber' }">
    <template v-if="aReceber.devedores.length">
      <span class="corpo">
        <span class="textos">
          <span class="valor">{{ reais(aReceber.total) }}</span>
          <span class="detalhe">{{ detalhe }}</span>
        </span>
        <span class="quem" role="img" :aria-label="`Devem: ${quem}`">
          <IniciaisPessoa v-for="d in devedores.slice(0, MOSTRADAS)" :key="d.pessoaId" :nome="d.nome" />
          <span v-if="devedores.length > MOSTRADAS" class="mais">+{{ devedores.length - MOSTRADAS }}</span>
        </span>
      </span>
    </template>
    <p v-else class="vazio">Ninguém te deve agora.</p>
  </CartaoAtalho>
</template>

<style scoped>
.corpo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.textos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.valor {
  font-family: var(--fonte-numeros);
  font-size: 22px;
  font-weight: 600;
  color: var(--alerta);
}

.detalhe {
  font-size: 12px;
  color: var(--texto-suave);
}

.quem {
  display: flex;
  align-items: center;
}

.quem > * + * {
  margin-left: -8px;
  box-shadow: 0 0 0 2px var(--superficie);
}

.mais {
  font-size: 12px;
  color: var(--texto-suave);
  padding-left: 12px;
}

.vazio {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
}
</style>

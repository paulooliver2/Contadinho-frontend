<script setup lang="ts">
import { computed } from 'vue'
import { diaMes, hojeIso, reais } from '@/lib/formatos'
import { formatarWhatsapp } from '@/lib/telefone'
import type { Pessoa } from '@/stores/pessoas'
import type { Situacao } from './receber'
import SeloStatus from './SeloStatus.vue'

/**
 * Uma pessoa na lista de A receber: iniciais, nome e, com `situacao`, o saldo, o status e o vencimento mais
 * próximo (HU-18). Sem nada registrado, mostra apelido e WhatsApp. Tocar abre o histórico.
 */
const props = defineProps<{ pessoa: Pessoa; situacao?: Situacao }>()
const emit = defineEmits<{ abrir: [] }>()

const iniciais = computed(() => {
  const partes = props.pessoa.nome.split(/\s+/).filter(Boolean)
  const letras = partes.length > 1 ? partes[0]![0]! + partes[partes.length - 1]![0]! : props.pessoa.nome.slice(0, 2)
  return letras.toUpperCase()
})

const detalhes = computed(() => {
  const p = props.pessoa
  const s = props.situacao
  if (s && s.saldo > 0) {
    const partes = [`de ${reais(s.original)}`]
    if (s.proximoVencimento) {
      partes.push(`${s.proximoVencimento < hojeIso() ? 'venceu' : 'vence'} ${diaMes(s.proximoVencimento)}`)
    }
    return partes.join(' · ')
  }
  const partes: string[] = []
  if (p.apelido) partes.push(p.apelido)
  partes.push(p.whatsapp ? formatarWhatsapp(p.whatsapp) : 'sem WhatsApp')
  return partes.join(' · ')
})
</script>

<template>
  <li>
    <button type="button" class="linha" :class="{ arquivada: pessoa.arquivada }" :aria-label="`Ver ${pessoa.nome}`" @click="emit('abrir')">
      <span class="iniciais" aria-hidden="true">{{ iniciais }}</span>
      <span class="textos">
        <span class="nome">{{ pessoa.nome }}</span>
        <span class="detalhes">{{ detalhes }}</span>
      </span>
      <span v-if="situacao" class="saldo">
        <span class="valor">{{ reais(situacao.saldo) }}</span>
        <SeloStatus :status="situacao.status" />
      </span>
    </button>
  </li>
</template>

<style scoped>
li {
  list-style: none;
}

li + li {
  border-top: 1px solid var(--divisoria);
}

.linha {
  width: 100%;
  min-height: 60px;
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: var(--texto);
  font: inherit;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.iniciais {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--marca-clara);
  color: var(--marca-escura);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arquivada .iniciais {
  background: var(--divisoria);
  color: var(--texto-suave);
}

.textos {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.nome {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalhes {
  font-size: 12px;
  color: var(--texto-suave);
}

.saldo {
  margin-left: auto;
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.valor {
  font-family: var(--fonte-numeros);
  font-size: 14px;
}
</style>

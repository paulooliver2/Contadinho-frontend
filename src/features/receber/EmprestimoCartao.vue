<script setup lang="ts">
import { computed, ref } from 'vue'
import { diaMes, reais } from '@/lib/formatos'
import type { EmprestimoDaPessoa } from './receber'

/**
 * Um empréstimo no histórico da pessoa (HU-17): as parcelas, cada uma "paga" ou com o que falta (RN-30). Excluir pede
 * um segundo toque.
 */
const props = defineProps<{ emprestimo: EmprestimoDaPessoa; excluindo?: boolean }>()
const emit = defineEmits<{ excluir: [] }>()

const confirmando = ref(false)
const titulo = computed(() => props.emprestimo.descricao || 'Empréstimo')
const total = computed(() => props.emprestimo.parcelas.length)

function situacao(p: EmprestimoDaPessoa['parcelas'][number]): string | null {
  if (p.emAberto === 0) return 'paga'
  return p.emAberto < p.valor ? `falta ${reais(p.emAberto)}` : null
}

function tocar() {
  if (props.excluindo) return
  if (!confirmando.value) {
    confirmando.value = true
    return
  }
  confirmando.value = false
  emit('excluir')
}
</script>

<template>
  <section class="cartao" :aria-label="`Empréstimo: ${titulo}`">
    <header class="topo">
      <span class="titulo">{{ titulo }}</span>
      <span class="total">{{ reais(emprestimo.valor) }}{{ total > 1 ? ` em ${total}x` : '' }}</span>
    </header>
    <ul class="parcelas">
      <li v-for="p in emprestimo.parcelas" :key="p.numero" class="parcela">
        <span class="textos">
          <span>{{ total > 1 ? `Parcela ${p.numero}/${total}` : 'Devolução' }}</span>
          <span class="detalhes">
            {{ p.vencimento ? `vence ${diaMes(p.vencimento)}` : 'sem data' }}
            <span v-if="situacao(p)" class="selo">{{ situacao(p) }}</span>
          </span>
        </span>
        <span class="valor">{{ reais(p.valor) }}</span>
      </li>
    </ul>
    <button type="button" class="excluir" :class="{ confirmando }" :disabled="excluindo" @click="tocar" @blur="confirmando = false">
      {{ excluindo ? 'Excluindo…' : confirmando ? 'Toque de novo para excluir' : 'Excluir empréstimo' }}
    </button>
  </section>
</template>

<style scoped>
.cartao {
  border-radius: var(--raio-card);
  background: var(--superficie);
  overflow: hidden;
}

.topo {
  padding: 12px 16px 8px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.titulo {
  min-width: 0;
  font-size: 15px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.total {
  flex: none;
  font-size: 13px;
  color: var(--texto-suave);
}

.parcelas {
  margin: 0;
  padding: 0;
}

.parcela {
  list-style: none;
  min-height: 52px;
  padding: 8px 16px;
  border-top: 1px solid var(--divisoria);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 14px;
  font-weight: 600;
}

.textos {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detalhes {
  font-size: 12px;
  font-weight: 400;
  color: var(--texto-suave);
  display: flex;
  align-items: center;
  gap: 6px;
}

.selo {
  padding: 1px 8px;
  border-radius: 8px;
  background: var(--info-claro);
  color: var(--info);
  font-size: 11px;
  font-weight: 600;
}

.valor {
  font-family: var(--fonte-numeros);
  font-weight: 400;
  white-space: nowrap;
}

.excluir {
  width: 100%;
  min-height: var(--toque-minimo);
  border: none;
  border-top: 1px solid var(--divisoria);
  background: transparent;
  color: var(--texto-suave);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.excluir.confirmando {
  background: var(--alerta-claro);
  color: var(--alerta);
}
</style>

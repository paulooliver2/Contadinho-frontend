<script setup lang="ts">
import { computed } from 'vue'
import { diasEntre, hojeIso, reais } from '@/lib/formatos'
import type { ContaDoMes } from './gastos'

/**
 * Uma conta fixa no mês (HU-11): iniciais da categoria, como se paga, o valor e o status (RN-57). A pagar mostra
 * quanto falta para vencer. Tocar abre o cadastro.
 */
const props = defineProps<{ item: ContaDoMes; categoria: string; cartao?: string }>()
const emit = defineEmits<{ abrir: [] }>()

const iniciais = computed(() => props.categoria.slice(0, 2).toUpperCase())

const detalhes = computed(() => {
  const c = props.item.conta
  const forma = {
    PIX_BOLETO: 'Pix ou boleto',
    DEBITO_AUTOMATICO: 'Débito automático',
    CARTAO: `Cartão ${props.cartao ?? ''}`.trim(),
  }[c.formaPagamento]
  const partes = [`Todo dia ${c.diaVencimento}`, forma]
  if (c.encerradaEm) partes.push('encerrada')
  return partes.join(' · ')
})

const selo = computed((): { texto: string; tom: string } => {
  const i = props.item
  if (i.status === 'PAGA') return { texto: 'Paga', tom: 'paga' }
  if (i.status === 'NA_FATURA') return { texto: 'Na fatura', tom: 'fatura' }
  if (i.status === 'AGUARDANDO_FATURA') return { texto: 'Aguardando fatura', tom: 'fatura' }
  const dias = diasEntre(hojeIso(), i.vencimento)
  if (dias > 1) return { texto: `Vence em ${dias} dias`, tom: 'aberta' }
  if (dias === 1) return { texto: 'Vence amanhã', tom: 'aberta' }
  if (dias === 0) return { texto: 'Vence hoje', tom: 'atrasada' }
  return { texto: dias === -1 ? 'Venceu ontem' : `Venceu há ${-dias} dias`, tom: 'atrasada' }
})
</script>

<template>
  <li>
    <button type="button" class="linha" :aria-label="`Editar ${item.conta.descricao}`" @click="emit('abrir')">
      <span class="iniciais" aria-hidden="true">{{ iniciais }}</span>
      <span class="textos">
        <span class="descricao">{{ item.conta.descricao }}</span>
        <span class="detalhes">{{ detalhes }}</span>
      </span>
      <span class="direita">
        <span class="valor">{{ reais(item.valor) }}</span>
        <span class="selo" :class="selo.tom">{{ selo.texto }}</span>
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
  min-height: 64px;
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
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--fundo);
  color: var(--rotulo);
  font-size: 13px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.textos {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.descricao {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalhes {
  font-size: 12px;
  color: var(--texto-suave);
}

.direita {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.valor {
  font-family: var(--fonte-numeros);
  font-size: 14px;
  white-space: nowrap;
}

.selo {
  padding: 1px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.paga {
  background: var(--marca-clara);
  color: var(--marca-escura);
}

.fatura {
  background: var(--info-claro);
  color: var(--info);
}

.aberta {
  background: var(--aviso-claro);
  color: var(--aviso);
}

.atrasada {
  background: var(--alerta-claro);
  color: var(--alerta);
}
</style>

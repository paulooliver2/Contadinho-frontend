<script setup lang="ts">
import { computed } from 'vue'
import LinhaItem from '@/components/LinhaItem.vue'
import { hojeIso, reais } from '@/lib/formatos'
import type { PosicaoResumo } from '@/stores/carteira'
import { dataCompleta, quantidade, taxa, titulo } from './formatos'
import GanhoTexto from './GanhoTexto.vue'

/**
 * Uma posição na Carteira: o nome, a quantidade (ou a taxa e o vencimento na renda fixa), o valor de hoje e o ganho
 * (HU-31). Sem cotação, mostra o aplicado; encerrada, o resultado.
 */
const props = defineProps<{ posicao: PosicaoResumo }>()
const emit = defineEmits<{ abrir: [] }>()

const nome = computed(() => titulo(props.posicao))

const iniciais = computed(() => {
  const p = props.posicao
  if (p.tipo === 'TESOURO') return 'TD'
  if (p.tipo === 'RENDA_FIXA') return (p.produto ?? 'RF').slice(0, 2)
  return (p.simbolo ?? p.codigo).slice(0, 2).toUpperCase()
})

const vencida = computed(() => {
  const p = props.posicao
  return p.tipo === 'RENDA_FIXA' && !p.encerrada && !!p.vencimento && p.vencimento < hojeIso()
})

const semCotacao = computed(() => !props.posicao.encerrada && props.posicao.valorAtual == null)

const detalhe = computed(() => {
  const p = props.posicao
  const partes: string[] = []
  if (p.tipo === 'RENDA_FIXA') {
    partes.push(taxa(p))
    if (p.vencimento) partes.push(`${vencida.value ? 'venceu' : 'vence'} em ${dataCompleta(p.vencimento)}`)
  } else {
    const qtd = quantidade(p, p.quantidade ?? 0)
    partes.push(p.tipo === 'ACAO' ? `${p.codigo} · ${qtd}` : qtd)
  }
  if (semCotacao.value) partes.push('sem cotação ainda')
  return partes.join(' · ')
})

const valor = computed(() => {
  const p = props.posicao
  if (p.encerrada) return reais(p.resultado ?? 0)
  return reais(p.valorAtual ?? p.aplicado)
})

const selo = computed(() => {
  if (vencida.value) return { texto: 'Venceu', tom: 'atrasada' as const }
  if (!props.posicao.conferido) return { texto: 'Não conferido', tom: 'aberta' as const }
  if (props.posicao.desatualizado) return { texto: 'Desatualizado', tom: 'aberta' as const }
  return undefined
})
</script>

<template>
  <LinhaItem
    :iniciais="iniciais"
    :titulo="nome"
    :detalhe="detalhe"
    :valor="valor"
    :selo="selo"
    :acao="`Abrir ${nome}`"
    @abrir="emit('abrir')"
  >
    <template #abaixo>
      <GanhoTexto v-if="posicao.ganho != null" :valor="posicao.ganho" :percentual="posicao.ganhoPercentual" />
    </template>
  </LinhaItem>
</template>

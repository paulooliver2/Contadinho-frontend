<script setup lang="ts">
import { computed, ref } from 'vue'
import { reais } from '@/lib/formatos'
import { diaMes } from './formatos'

/** HU-32: a linha do patrimônio, um ponto por dia. Tocar ou arrastar mostra o dia e o valor. */
const props = defineProps<{ pontos: { data: string; valor: number }[] }>()

const LARGURA = 320
const ALTURA = 120
const MARGEM = 6

const escala = computed(() => {
  const valores = props.pontos.map((p) => p.valor)
  const min = Math.min(...valores)
  const max = Math.max(...valores)
  // Linha reta no meio quando não muda nada.
  const faixa = max - min || 1
  const passo = (LARGURA - 2 * MARGEM) / Math.max(props.pontos.length - 1, 1)
  return (i: number, valor: number) => ({
    x: MARGEM + i * passo,
    y: max === min ? ALTURA / 2 : ALTURA - MARGEM - ((valor - min) / faixa) * (ALTURA - 2 * MARGEM),
  })
})

const linha = computed(() =>
  props.pontos
    .map((p, i) => {
      const { x, y } = escala.value(i, p.valor)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' '),
)

const escolhido = ref<number | null>(null)
const marca = computed(() => {
  if (escolhido.value == null) return null
  const p = props.pontos[escolhido.value]
  if (!p) return null
  return { ...escala.value(escolhido.value, p.valor), texto: `${diaMes(p.data)} · ${reais(p.valor)}` }
})

function escolher(evento: PointerEvent) {
  const alvo = evento.currentTarget as SVGSVGElement
  const caixa = alvo.getBoundingClientRect()
  const x = ((evento.clientX - caixa.left) / caixa.width) * LARGURA
  const passo = (LARGURA - 2 * MARGEM) / Math.max(props.pontos.length - 1, 1)
  escolhido.value = Math.min(props.pontos.length - 1, Math.max(0, Math.round((x - MARGEM) / passo)))
}

const primeiro = computed(() => props.pontos[0])
const ultimo = computed(() => props.pontos[props.pontos.length - 1])
</script>

<template>
  <figure v-if="pontos.length >= 2" class="grafico">
    <p class="rotulo-marca" aria-live="polite">{{ marca?.texto ?? ' ' }}</p>
    <svg
      role="img"
      aria-label="Gráfico da evolução"
      :viewBox="`0 0 ${LARGURA} ${ALTURA}`"
      preserveAspectRatio="none"
      @pointerdown="escolher"
      @pointermove="(e) => e.buttons > 0 || e.pointerType === 'mouse' ? escolher(e) : undefined"
      @pointerleave="escolhido = null"
    >
      <polyline :points="linha" fill="none" stroke="var(--marca)" stroke-width="2" vector-effect="non-scaling-stroke" />
      <template v-if="marca">
        <line :x1="marca.x" :x2="marca.x" y1="0" :y2="ALTURA" stroke="var(--borda)" vector-effect="non-scaling-stroke" />
        <circle :cx="marca.x" :cy="marca.y" r="3" fill="var(--marca)" />
      </template>
    </svg>
    <figcaption class="pontas">
      <span>{{ diaMes(primeiro!.data) }} · {{ reais(primeiro!.valor) }}</span>
      <span>{{ diaMes(ultimo!.data) }} · {{ reais(ultimo!.valor) }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.grafico {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

svg {
  width: 100%;
  height: 120px;
  touch-action: pan-y;
}

.rotulo-marca {
  margin: 0;
  min-height: 16px;
  font-family: var(--fonte-numeros);
  font-size: 12px;
  color: var(--texto);
}

.pontas {
  display: flex;
  justify-content: space-between;
  font-family: var(--fonte-numeros);
  font-size: 11px;
  color: var(--texto-suave);
}
</style>

<script setup lang="ts">
/**
 * Uma linha tocável de lista (conta fixa, gasto): iniciais, título, detalhe, valor e um selo de status. Vai dentro de
 * um `<ul>`.
 */
defineProps<{
  iniciais: string
  titulo: string
  detalhe: string
  valor: string
  selo?: { texto: string; tom: 'paga' | 'fatura' | 'aberta' | 'atrasada' }
  /** O que o toque faz, para leitores de tela: "Abrir Aluguel". */
  acao: string
}>()
const emit = defineEmits<{ abrir: [] }>()
</script>

<template>
  <li>
    <button type="button" class="linha" :aria-label="acao" @click="emit('abrir')">
      <span class="iniciais" aria-hidden="true">{{ iniciais }}</span>
      <span class="textos">
        <span class="titulo">{{ titulo }}</span>
        <span class="detalhe">{{ detalhe }}</span>
      </span>
      <span class="direita">
        <span class="valor">{{ valor }}</span>
        <!-- Uma linha a mais embaixo do valor, como o ganho de um investimento. -->
        <slot name="abaixo" />
        <span v-if="selo" class="selo" :class="selo.tom">{{ selo.texto }}</span>
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

.titulo {
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detalhe {
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

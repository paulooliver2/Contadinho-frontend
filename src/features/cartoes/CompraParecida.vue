<script setup lang="ts">
import ChipsEscolha from '@/components/ChipsEscolha.vue'
import { diaMes, reais } from '@/lib/formatos'
import type { ItemPrevia } from './faturas'

/** RN-59: uma compra do arquivo que parece a digitada. O dono diz se é a mesma ou outra. */
defineProps<{ item: ItemPrevia }>()
const decisao = defineModel<'MESMA' | 'OUTRA' | null>({ required: true })

const opcoes = [
  { valor: 'MESMA', rotulo: 'É a mesma' },
  { valor: 'OUTRA', rotulo: 'É outra' },
] as const
</script>

<template>
  <div class="parecida">
    <p class="resumo">
      <span class="valor">{{ reais(item.valor) }}</span> em {{ diaMes(item.data) }}
    </p>
    <dl>
      <dt>No arquivo</dt>
      <dd>{{ item.descricao }}</dd>
      <dt>Digitada</dt>
      <dd>{{ item.parecida?.descricao }}</dd>
    </dl>
    <ChipsEscolha v-model="decisao" :rotulo="`${item.descricao} é a compra digitada?`" :opcoes="opcoes" />
  </div>
</template>

<style scoped>
.parecida {
  padding: 14px;
  border-radius: var(--raio-card);
  border: 1px solid var(--borda);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resumo {
  margin: 0;
  font-size: 13px;
  color: var(--texto-suave);
}

.valor {
  font-family: var(--fonte-numeros);
  color: var(--texto);
}

dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 10px;
  font-size: 13px;
}

dt {
  color: var(--texto-suave);
}

dd {
  margin: 0;
  font-weight: 600;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>

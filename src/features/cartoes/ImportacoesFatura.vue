<script setup lang="ts">
import { diaMesCurto } from '@/lib/formatos'
import type { ImportacaoDaFatura } from './faturas'

/** Os arquivos importados na fatura, cada um com "Desfazer" (HU-44). */
defineProps<{ importacoes: ImportacaoDaFatura[] }>()
defineEmits<{ desfazer: [importacao: ImportacaoDaFatura] }>()

/** O dia da importação no fuso do aparelho, como "01/nov". */
const dia = (instante: string) => diaMesCurto(new Date(instante).toLocaleDateString('sv-SE'))
</script>

<template>
  <section class="importacoes" aria-labelledby="titulo-importacoes">
    <h2 id="titulo-importacoes">Arquivos importados</h2>
    <ul class="lista">
      <li v-for="i in importacoes" :key="i.id">
        <span class="textos">
          <span class="nome">{{ i.nomeArquivo }}</span>
          <span class="detalhe">
            {{ i.formato }} · {{ dia(i.importadaEm) }} · {{ i.compras === 1 ? '1 compra' : `${i.compras} compras` }}
          </span>
        </span>
        <button type="button" class="desfazer" :aria-label="`Desfazer ${i.nomeArquivo}`" @click="$emit('desfazer', i)">
          Desfazer
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.importacoes {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

h2 {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rotulo);
}

.lista {
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: var(--raio-card);
  background: var(--superficie);
  overflow: hidden;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 4px 8px 16px;
}

li + li {
  border-top: 1px solid var(--divisoria);
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

.detalhe {
  font-size: 12px;
  color: var(--texto-suave);
}

.desfazer {
  flex: none;
  min-height: var(--toque-minimo);
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--marca);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>

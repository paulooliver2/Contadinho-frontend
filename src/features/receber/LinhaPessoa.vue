<script setup lang="ts">
import { computed } from 'vue'
import { formatarWhatsapp } from '@/lib/telefone'
import type { Pessoa } from '@/stores/pessoas'

/** Uma pessoa na lista de A receber: iniciais, nome, apelido e WhatsApp. Tocar abre a edição. */
const props = defineProps<{ pessoa: Pessoa }>()
const emit = defineEmits<{ abrir: [] }>()

const iniciais = computed(() => {
  const partes = props.pessoa.nome.split(/\s+/).filter(Boolean)
  const letras = partes.length > 1 ? partes[0]![0]! + partes[partes.length - 1]![0]! : props.pessoa.nome.slice(0, 2)
  return letras.toUpperCase()
})

const detalhes = computed(() => {
  const p = props.pessoa
  const partes: string[] = []
  if (p.apelido) partes.push(p.apelido)
  partes.push(p.whatsapp ? formatarWhatsapp(p.whatsapp) : 'sem WhatsApp')
  return partes.join(' · ')
})
</script>

<template>
  <li>
    <button type="button" class="linha" :class="{ arquivada: pessoa.arquivada }" :aria-label="`Editar ${pessoa.nome}`" @click="emit('abrir')">
      <span class="iniciais" aria-hidden="true">{{ iniciais }}</span>
      <span class="textos">
        <span class="nome">{{ pessoa.nome }}</span>
        <span class="detalhes">{{ detalhes }}</span>
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
</style>

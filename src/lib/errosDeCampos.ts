import { ref, watch, type WatchSource } from 'vue'

/**
 * Erros por campo de um formulário (campo → mensagem). O erro de um campo some assim que ele é editado;
 * um erro pode depender de mais de um campo, como a parcela (atual e total).
 */
export function useErrosDeCampos(campos: Record<string, WatchSource | WatchSource[]>) {
  const erros = ref<Record<string, string>>({})

  for (const [chave, fontes] of Object.entries(campos)) {
    watch(fontes, () => {
      if (!(chave in erros.value)) return
      const { [chave]: _removido, ...resto } = erros.value
      erros.value = resto
    })
  }

  return erros
}

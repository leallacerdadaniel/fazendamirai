const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'com', 'para', 'por', 'a', 'o', 'ao', 'à', 'aos', 'na', 'no', 'nas', 'nos', 'sem', 'ou', 'até']);

/**
 * Capitaliza rótulos vindos do banco (armazenados em minúsculas) para exibição.
 * Preserva siglas já em maiúsculas (PO, FIV, CMT) e não rebaixa palavras capitalizadas.
 * Conectivos (de, da, e, ...) permanecem minúsculos, exceto na primeira palavra.
 * Ex.: "sem lote" -> "Sem Lote"; "vaca" -> "Vaca"; "girolando 3/4" -> "Girolando 3/4".
 */
export function cap(s?: string | null): string {
  if (!s) return '';
  const words = String(s).trim().split(/\s+/);
  return words
    .map((w, i) => {
      if (i > 0 && STOPWORDS.has(w.toLowerCase())) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

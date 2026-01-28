// Utilitários gerais (pode ser expandido nas próximas fases)

/**
 * Converte string numérica no formato ABNT (vírgula decimal, ponto milhares) para número.
 * Ex.: "1.234,56" → 1234.56; "1232,1" → 1232.1
 * Valores com mais de 2 casas decimais são arredondados para 2 casas.
 */
export function parseNumeroABNT(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const s = String(val).trim();
  if (!s) return 0;
  let normalized: string;
  if (s.includes(",")) {
    // ABNT: vírgula = decimal, ponto = milhares
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = s;
  }
  const n = parseFloat(normalized);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100) / 100; // máx. 2 casas decimais
}



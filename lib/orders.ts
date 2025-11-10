export function gerarCodigoPedido() {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${rnd}`;
}


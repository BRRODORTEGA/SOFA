import React from "react";

export function FactoryNewOrderEmail({ codigo, itens }: { codigo: string; itens: any[] }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "600px" }}>
      <h2>Novo pedido recebido: {codigo}</h2>
      <p>Um novo pedido foi solicitado e precisa de atenção.</p>
      <p><strong>Código:</strong> {codigo}</p>
      <p><strong>Itens:</strong> {itens.length}</p>
      <p>Acesse o painel administrativo para visualizar os detalhes e processar o pedido.</p>
    </div>
  );
}


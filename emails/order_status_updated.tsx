import React from "react";

export function OrderStatusUpdatedEmail({ codigo, novoStatus }: { codigo: string; novoStatus: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "600px" }}>
      <h2>Atualização do pedido: {codigo}</h2>
      <p>O status do seu pedido foi atualizado.</p>
      <p><strong>Código:</strong> {codigo}</p>
      <p><strong>Novo status:</strong> {novoStatus}</p>
      <p>Acompanhe os detalhes em "Meus Pedidos" no site.</p>
    </div>
  );
}


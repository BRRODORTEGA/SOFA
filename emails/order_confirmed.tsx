import React from "react";

export function OrderConfirmedEmail({ codigo }: { codigo: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "600px" }}>
      <h2>Pedido aprovado: {codigo}</h2>
      <p>Seu pedido foi aprovado e está em produção!</p>
      <p><strong>Código:</strong> {codigo}</p>
      <p>Você receberá atualizações sobre o progresso do seu pedido.</p>
      <p>Acompanhe o status em "Meus Pedidos" no site.</p>
    </div>
  );
}


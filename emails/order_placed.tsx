import React from "react";

export function OrderPlacedEmail({ name, codigo, total }: { name: string; codigo: string; total: number }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "600px" }}>
      <h2>Pedido recebido: {codigo}</h2>
      <p>Olá {name},</p>
      <p>Recebemos seu pedido. Em breve enviaremos atualizações sobre o status.</p>
      <p><strong>Total: R$ {total.toFixed(2)}</strong></p>
      <p>Acompanhe seu pedido em "Meus Pedidos" no site.</p>
    </div>
  );
}


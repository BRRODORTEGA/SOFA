import React from "react";

export function OrderRejectedEmail({ codigo, motivo }: { codigo: string; motivo: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "600px" }}>
      <h2>Pedido reprovado: {codigo}</h2>
      <p>Infelizmente, seu pedido foi reprovado.</p>
      <p><strong>Código:</strong> {codigo}</p>
      {motivo && (
        <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f5f5f5" }}>
          <p><strong>Motivo:</strong></p>
          <p>{motivo}</p>
        </div>
      )}
      <p>Se tiver dúvidas, entre em contato conosco através do canal de mensagens do pedido.</p>
    </div>
  );
}


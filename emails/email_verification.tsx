import React from "react";

export function EmailVerificationEmail({ name, verificationUrl }: { name: string; verificationUrl: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ backgroundColor: "#f7f7f7", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <h1 style={{ color: "#1a1a19", margin: "0 0 10px 0" }}>Bem-vindo ao AI Sofá!</h1>
      </div>
      
      <p style={{ color: "#333", fontSize: "16px", lineHeight: "1.6" }}>
        Olá {name || "Cliente"},
      </p>
      
      <p style={{ color: "#333", fontSize: "16px", lineHeight: "1.6" }}>
        Obrigado por criar sua conta no AI Sofá! Para ativar sua conta e começar a fazer suas compras, 
        clique no botão abaixo para confirmar seu e-mail:
      </p>
      
      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <a
          href={verificationUrl}
          style={{
            display: "inline-block",
            backgroundColor: "#1a1a19",
            color: "#ffffff",
            padding: "14px 28px",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "16px",
          }}
        >
          Confirmar E-mail
        </a>
      </div>
      
      <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.6" }}>
        Ou copie e cole este link no seu navegador:
      </p>
      <p style={{ color: "#1a1a19", fontSize: "12px", wordBreak: "break-all", backgroundColor: "#f7f7f7", padding: "10px", borderRadius: "4px" }}>
        {verificationUrl}
      </p>
      
      <p style={{ color: "#666", fontSize: "14px", lineHeight: "1.6", marginTop: "30px" }}>
        Este link expira em 24 horas. Se você não criou esta conta, pode ignorar este e-mail.
      </p>
      
      <div style={{ marginTop: "30px", paddingTop: "20px", borderTop: "1px solid #e5e5e5" }}>
        <p style={{ color: "#999", fontSize: "12px", margin: "0" }}>
          AI Sofá - Sofás sob medida com o conforto que você merece
        </p>
      </div>
    </div>
  );
}




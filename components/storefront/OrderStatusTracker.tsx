"use client";

interface StatusHistory {
  status: string;
  createdAt: string;
}

interface OrderStatusTrackerProps {
  currentStatus: string;
  historico: StatusHistory[];
}

const STATUS_ORDER = [
  "Solicitado",
  "Aguardando Pagamento",
  "Pagamento Aprovado",
  "Em Produção",
  "Em Expedição",
  "Em Transporte",
  "Entregue",
];

// Mapear status antigos para novos (compatibilidade)
const STATUS_MAP: Record<string, string> = {
  "Expedido": "Em Expedição",
};

const STATUS_LABELS: Record<string, string> = {
  "Solicitado": "Pedido Solicitado",
  "Aguardando Pagamento": "Aguardando Pagamento",
  "Pagamento Aprovado": "Pagamento Aprovado",
  "Em Produção": "Em Produção",
  "Em Expedição": "Em Expedição",
  "Em Transporte": "Em Transporte",
  "Entregue": "Entregue",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Solicitado": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  "Aguardando Pagamento": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "Pagamento Aprovado": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  "Em Produção": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  "Em Expedição": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  "Em Transporte": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12a2 2 0 11-4 0 2 2 0 014 0zM19 12a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6h3l2 4h-4M5 6h4m-4 4h4m6 0h2m-2 4h2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18" />
    </svg>
  ),
  "Entregue": (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
};

export function OrderStatusTracker({ currentStatus, historico }: OrderStatusTrackerProps) {
  // Normalizar status atual (mapear status antigos para novos)
  const normalizedStatus = STATUS_MAP[currentStatus] || currentStatus;
  
  // Criar mapa de histórico por status
  const historicoMap = new Map<string, string>();
  historico.forEach((h) => {
    const normalizedHistStatus = STATUS_MAP[h.status] || h.status;
    if (!historicoMap.has(normalizedHistStatus)) {
      historicoMap.set(normalizedHistStatus, h.createdAt);
    }
  });

  // Encontrar índice do status atual
  const currentIndex = STATUS_ORDER.indexOf(normalizedStatus);
  const isCompleted = (index: number) => index <= currentIndex;
  const isCurrent = (index: number) => index === currentIndex;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">Status do pedido</h2>
      <div className="flex min-w-max items-start justify-center gap-1">
        {STATUS_ORDER.map((status, index) => {
          const completed = isCompleted(index);
          const current = isCurrent(index);
          const dateInfo = historicoMap.get(status);
          const formattedDate = dateInfo
            ? new Date(dateInfo).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null;

          return (
            <div key={status} className="flex items-start">
              {/* Etapa */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all ${
                    completed
                      ? "border-purple-600 bg-purple-600 text-white shadow-md"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {STATUS_ICONS[status] || (
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="mt-3 w-24 text-center">
                  <p
                    className={`text-xs font-medium leading-tight ${
                      completed ? "text-purple-600" : "text-gray-400"
                    }`}
                  >
                    {STATUS_LABELS[status] || status}
                  </p>
                  {formattedDate && completed && (
                    <p className="mt-1 text-xs text-purple-600">
                      {formattedDate.split(',')[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Linha conectora */}
              {index < STATUS_ORDER.length - 1 && (
                <div className="relative mt-7 flex h-0.5 w-12 items-center">
                  <div
                    className={`h-full w-full transition-colors ${
                      completed ? "bg-purple-600" : "bg-gray-300"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


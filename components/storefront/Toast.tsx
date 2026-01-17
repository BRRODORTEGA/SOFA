"use client";

import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Aguarda animação de saída
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    if (type === "success") {
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (type === "error") {
      return (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getStyles = () => {
    if (type === "success") {
      return {
        bg: "bg-green-600",
        border: "border-green-700/30",
        iconBg: "bg-white/20 backdrop-blur-sm",
        iconColor: "text-white",
        textColor: "text-white",
      };
    }
    if (type === "error") {
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        iconBg: "bg-red-500",
        iconColor: "text-white",
        textColor: "text-red-800",
      };
    }
    return {
      bg: "bg-secondary",
      border: "border-primary/20",
      iconBg: "bg-primary",
      iconColor: "text-white",
      textColor: "text-primary",
    };
  };

  const styles = getStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 rounded-lg border ${styles.border} ${styles.bg} px-4 py-3 shadow-xl transition-all duration-300 ease-in-out ${
        isVisible ? "translate-x-0 opacity-100 scale-100" : "translate-x-full opacity-0 scale-95"
      }`}
      style={{ minWidth: "320px", maxWidth: "420px" }}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} ${styles.iconColor}`}>
        {getIcon()}
      </div>
      <p className={`flex-1 text-sm font-medium ${styles.textColor}`}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose?.();
          }, 300);
        }}
        className={`flex-shrink-0 ${styles.textColor} hover:opacity-70 transition-opacity`}
        aria-label="Fechar notificação"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type?: "success" | "error" | "info" }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}


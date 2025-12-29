"use client";

import * as React from "react";
import * as Slider from "@radix-ui/react-slider";

type PriceRange = { min: number; max: number };

type PriceFilterProps = {
  minLimit?: number;      // ex: 0
  maxLimit?: number;      // ex: 1949
  step?: number;          // ex: 1
  value: PriceRange;      // estado externo (controlado)
  onChange: (next: PriceRange) => void;
  onClear?: () => void;
  className?: string;
  title?: string;         // Título personalizado do filtro
};

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function formatBRL(value: number) {
  // Evita bugs de locale/format
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function parseNumberOrNull(raw: string): number | null {
  // Aceita vazio durante digitação
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Remove tudo que não for dígito (permitindo usuário digitar "1.949" ou "R$ 1.949")
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  if (!digitsOnly) return null;

  const n = Number(digitsOnly);
  return Number.isFinite(n) ? n : null;
}

export function PriceFilter({
  minLimit = 0,
  maxLimit = 2000,
  step = 1,
  value,
  onChange,
  onClear,
  className,
  title = "Preço",
}: PriceFilterProps) {
  // Estados de input (string) para permitir digitar livremente sem virar NaN
  const [minText, setMinText] = React.useState<string>(String(value.min));
  const [maxText, setMaxText] = React.useState<string>(String(value.max));

  // Sempre que o value externo mudar, refletir nos inputs
  React.useEffect(() => {
    setMinText(String(value.min));
    setMaxText(String(value.max));
  }, [value.min, value.max]);

  const applyRange = React.useCallback(
    (nextMin: number, nextMax: number) => {
      // clamp geral
      let minV = clamp(nextMin, minLimit, maxLimit);
      let maxV = clamp(nextMax, minLimit, maxLimit);

      // garantir ordem
      if (minV > maxV) {
        // estratégia: "encostar" (mantém a intenção do usuário)
        minV = maxV;
      }

      onChange({ min: minV, max: maxV });
    },
    [minLimit, maxLimit, onChange]
  );

  const handleSliderChange = (vals: number[]) => {
    const [a, b] = vals;
    applyRange(a, b);
  };

  const normalizeMinOnBlur = () => {
    const parsed = parseNumberOrNull(minText);
    if (parsed === null) {
      // se apagou, volta para o valor atual controlado
      setMinText(String(value.min));
      return;
    }
    applyRange(parsed, value.max);
  };

  const normalizeMaxOnBlur = () => {
    const parsed = parseNumberOrNull(maxText);
    if (parsed === null) {
      setMaxText(String(value.max));
      return;
    }
    applyRange(value.min, parsed);
  };

  const handleClear = () => {
    const next = { min: minLimit, max: maxLimit };
    onChange(next);
    onClear?.();
  };

  const hasFilters = value.min !== minLimit || value.max !== maxLimit;

  return (
    <div className={["w-full rounded-lg border border-gray-200 bg-gray-50 p-4", className].filter(Boolean).join(" ")}>
      <div className="mb-4">
        <div className="text-base font-semibold text-gray-900 mb-3">{title}</div>

        <div className="mt-3">
          <Slider.Root
            className="relative flex h-5 w-full touch-none select-none items-center"
            min={minLimit}
            max={maxLimit}
            step={step}
            value={[value.min, value.max]}
            onValueChange={handleSliderChange}
            aria-label="Filtro de preço"
          >
            <Slider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
              <Slider.Range className="absolute h-full bg-primary" />
            </Slider.Track>

            <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-white bg-primary shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-grab active:cursor-grabbing transition-transform hover:scale-110" />
            <Slider.Thumb className="block h-5 w-5 rounded-full border-2 border-white bg-primary shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-grab active:cursor-grabbing transition-transform hover:scale-110" />
          </Slider.Root>

          <div className="mt-2 flex items-center justify-between text-sm font-medium text-gray-900">
            <span>{formatBRL(value.min)}</span>
            <span>{formatBRL(value.max)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-700">Mínimo</span>
          <input
            inputMode="numeric"
            value={minText}
            onChange={(e) => setMinText(e.target.value)}
            onBlur={normalizeMinOnBlur}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={formatBRL(minLimit)}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-700">Máximo</span>
          <input
            inputMode="numeric"
            value={maxText}
            onChange={(e) => setMaxText(e.target.value)}
            onBlur={normalizeMaxOnBlur}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder={formatBRL(maxLimit)}
          />
        </label>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="mt-4 h-10 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200"
        >
          Limpar Filtro
        </button>
      )}
    </div>
  );
}


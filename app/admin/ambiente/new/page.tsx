"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ambienteSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";
import { z } from "zod";

type AmbienteForm = z.infer<typeof ambienteSchema>;

export default function NewAmbientePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AmbienteForm>({
    resolver: zodResolver(ambienteSchema),
    defaultValues: { ativo: true },
  });

  async function onSubmit(values: AmbienteForm) {
    try {
      const res = await fetch("/api/ambientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        router.push("/admin/ambiente");
      } else {
        const data = await res.json();
        alert("Erro ao criar ambiente: " + (data.message || "Erro desconhecido"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao criar ambiente");
    }
  }

  return (
    <FormShell
      title="Novo Tipo de Ambiente"
      actions={
        <>
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={() => router.back()}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            form="ambiente-form"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="ambiente-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">Nome</label>
          <input
            {...register("nome")}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Sala de estar, Quarto"
          />
          {errors.nome && (
            <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ativo"
            {...register("ativo")}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
            Ativo
          </label>
        </div>
      </form>
    </FormShell>
  );
}

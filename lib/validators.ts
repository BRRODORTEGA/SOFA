import { z } from "zod";

export const categoriaSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  ativo: z.boolean().default(true),
});

export const familiaSchema = z.object({
  categoriaId: z.string().cuid(),
  nome: z.string().min(2),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  perfilMedidas: z.any().optional().nullable(), // validaremos JSON no cliente
});

export const tecidoSchema = z.object({
  nome: z.string().min(2),
  grade: z.enum(["G1000","G2000","G3000","G4000","G5000","G6000","G7000","COURO"]),
  imagemUrl: z.union([z.string().url(), z.literal("")]).optional().nullable(),
  ativo: z.boolean().default(true),
});

export const produtoSchema = z.object({
  categoriaId: z.string().cuid(),
  familiaId: z.string().cuid(),
  nome: z.string().min(2),
  tipo: z.string().optional().nullable(),
  abertura: z.string().optional().nullable(),
  acionamento: z.string().optional().nullable(),
  configuracao: z.string().optional().nullable(),
  status: z.boolean().default(true),
  imagens: z.array(z.union([z.string().url(), z.literal("")])).default([]),
});

export const produtoTecidosSchema = z.object({
  tecidoIds: z.array(z.string().cuid()).min(0),
});

export const variacaoSchema = z.object({
  medida_cm: z.coerce.number().int().positive(),
  largura_cm: z.coerce.number().int().positive(),
  profundidade_cm: z.coerce.number().int().positive(),
  altura_cm: z.coerce.number().int().positive(),
  metragem_tecido_m: z.coerce.number().positive(),
  metragem_couro_m: z.coerce.number().positive(),
});

export const variacoesGenerateSchema = z.object({
  medidasFixas: z.array(z.number().int().positive()).default([]),
  medidasCustom: z.array(z.number().int().positive()).default([]),
  usarPerfilFamilia: z.boolean().default(true),
  criarSkeletonPreco: z.boolean().default(true),
}).refine((data) => (data.medidasFixas.length + data.medidasCustom.length) > 0, {
  message: "Selecione ou informe ao menos 1 medida.",
  path: ["medidasFixas"],
});

export const tabelaPrecoLinhaSchema = z.object({
  medida_cm: z.coerce.number().int().positive(),
  largura_cm: z.coerce.number().int().positive(),
  profundidade_cm: z.coerce.number().int().positive(),
  altura_cm: z.coerce.number().int().positive(),
  metragem_tecido_m: z.coerce.number().nonnegative(),
  metragem_couro_m: z.coerce.number().nonnegative(),
  preco_grade_1000: z.coerce.number().nonnegative(),
  preco_grade_2000: z.coerce.number().nonnegative(),
  preco_grade_3000: z.coerce.number().nonnegative(),
  preco_grade_4000: z.coerce.number().nonnegative(),
  preco_grade_5000: z.coerce.number().nonnegative(),
  preco_grade_6000: z.coerce.number().nonnegative(),
  preco_grade_7000: z.coerce.number().nonnegative(),
  preco_couro: z.coerce.number().nonnegative(),
});


import { z } from "zod";

export const categoriaSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  ativo: z.boolean().default(true),
});

export const ambienteSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  ativo: z.boolean().default(true),
});

export const familiaSchema = z.object({
  categoriaId: z.string().cuid().optional(),
  nome: z.string().min(2),
  descricao: z.string().optional().nullable(),
  ativo: z.boolean().default(true),
  perfilMedidas: z.any().optional().nullable(), // validaremos JSON no cliente
});

export const tecidoSchema = z.object({
  nome: z.string().min(2),
  grade: z.enum(["G1000","G2000","G3000","G4000","G5000","G6000","G7000","COURO"]),
  imagemUrl: z.string().refine(
    (val) => {
      if (!val || val.trim() === "") return true; // Permite string vazia
      // Aceita URLs completas (http://, https://)
      if (val.startsWith("http://") || val.startsWith("https://")) {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      }
      // Aceita caminhos relativos que começam com /
      if (val.startsWith("/")) {
        return true;
      }
      return false;
    },
    { message: "Deve ser uma URL válida (http:// ou https://) ou um caminho relativo (começando com /)" }
  ).optional().nullable(),
  fornecedorNome: z.string().optional().nullable(),
  valor_m2: z.coerce.number().nonnegative().optional().nullable(),
  ativo: z.boolean().default(true),
});

export const produtoSchema = z.object({
  categoriaId: z.string().cuid(),
  familiaId: z.string().cuid(),
  nome: z.string().min(2),
  tipo: z.string().optional().nullable(),
  abertura: z.string().optional().nullable(),
  acionamento: z.string().optional().nullable(),
  possuiLados: z.boolean(),
  configuracao: z.string().optional().nullable(),
  informacoesAdicionais: z.string().optional().nullable(),
  status: z.boolean().default(true),
  imagens: z.array(
    z.string().refine(
      (val) => {
        if (!val || val.trim() === "") return true; // Permite string vazia
        // Aceita URLs completas (http://, https://)
        if (val.startsWith("http://") || val.startsWith("https://")) {
          try {
            new URL(val);
            return true;
          } catch {
            return false;
          }
        }
        // Aceita caminhos relativos que começam com /
        if (val.startsWith("/")) {
          return true;
        }
        return false;
      },
      { message: "Deve ser uma URL válida (http:// ou https://) ou um caminho relativo (começando com /)" }
    )
  ).default([]),
});

export const produtoTecidosSchema = z.object({
  tecidoIds: z.array(z.string().cuid()).min(0),
});

export const variacaoSchema = z.object({
  medida_cm: z.coerce.number().int().positive(),
  largura_cm: z.coerce.number().int().nonnegative(), // Permite 0
  profundidade_cm: z.coerce.number().int().nonnegative(), // Permite 0
  altura_cm: z.coerce.number().int().nonnegative(), // Permite 0
  largura_assento_cm: z.coerce.number().int().nonnegative().default(0), // Permite 0
  altura_assento_cm: z.coerce.number().int().nonnegative().default(0), // Permite 0
  largura_braco_cm: z.coerce.number().int().nonnegative().default(0), // Permite 0
  metragem_tecido_m: z.coerce.number().nonnegative(), // Permite 0
  metragem_couro_m: z.coerce.number().nonnegative(), // Permite 0
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

export const tabelaPrecoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  ativo: z.boolean().default(true),
  descricao: z.string().optional().nullable(),
});

export const tabelaPrecoLinhaSchema = z.object({
  medida_cm: z.coerce.number().int().positive(),
  // Permitir zero para dimensões (podem ser preenchidas depois)
  largura_cm: z.coerce.number().int().nonnegative(),
  profundidade_cm: z.coerce.number().int().nonnegative(),
  altura_cm: z.coerce.number().int().nonnegative(),
  largura_assento_cm: z.coerce.number().int().nonnegative().default(0),
  altura_assento_cm: z.coerce.number().int().nonnegative().default(0),
  largura_braco_cm: z.coerce.number().int().nonnegative().default(0),
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
  descontoPercentual: z.coerce.number().min(0).max(100).optional().nullable(),
});


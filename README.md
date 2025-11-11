# AI SOFA — Sistema de Gestão de Móveis

Sistema completo de gestão de produtos, pedidos e tabela de preços para móveis sob medida.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- Auth.js (NextAuth) — autenticação com roles (ADMIN, OPERADOR, CLIENTE, FABRICA)
- Resend (e-mails transacionais)

## Setup

1. Copie `.env.example` para `.env` e ajuste as variáveis:
   - `DATABASE_URL` — conexão PostgreSQL
   - `NEXTAUTH_SECRET` — chave secreta para sessões
   - `RESEND_API_KEY` — chave da API Resend (opcional, funciona em modo mock)

2. Instale dependências: `npm i`

3. Configure o banco de dados:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. Rode o dev server: `npm run dev` (http://localhost:3000)

## Estrutura do Projeto

- `/app/(storefront)` — Loja pública (catálogo, PDP, carrinho, pedidos)
- `/app/admin` — Painel administrativo (CRUD de categorias, famílias, produtos, tecidos, pedidos)
- `/app/(storefront)/auth` — Autenticação (login, registro)
- `/app/api` — APIs REST (CRUD, carrinho, checkout, pedidos, preços)
- `/lib` — Helpers (prisma, auth, pricing, orders, email)
- `/prisma` — Schema do banco e seed de dados iniciais
- `/components` — Componentes reutilizáveis (admin, storefront)

## Funcionalidades Principais

### Storefront (Loja)
- Home page com categorias
- Catálogo de produtos por categoria
- Página de detalhes do produto (PDP) com:
  - Seleção de tecido (com grade)
  - Seleção de medida (variação)
  - Cálculo dinâmico de preço
  - Adicionar ao carrinho
- Carrinho persistente no banco de dados
- Checkout com criação de pedido
- Área "Meus Pedidos" para clientes
- Sistema de mensagens entre cliente e fábrica

### Admin Panel
- **Dashboard** — visão geral com métricas
- **Categorias** — CRUD completo
- **Famílias** — CRUD completo
- **Tecidos** — CRUD com campos de fornecedor e valor por m²
- **Produtos** — CRUD com:
  - Vínculo de tecidos (com grade)
  - Gestão de variações (medidas)
  - Tabela de preço por produto
  - Campos de dimensões (largura, profundidade, altura, assento, braço)
- **Tabela de Preço - Gestão Global** — módulo completo para:
  - Visualização de todos os preços cadastrados
  - Edição em massa
  - Import/Export CSV
  - Preview de import com highlight de alterações
  - Salvamento manual (sem autosave)
  - Proteção contra perda de dados
  - **Validações automáticas:**
    - Valores de grades crescentes (1000 < 2000 < 3000 < 4000 < 5000 < 6000 < 7000 < Couro)
    - Metragem crescente conforme medida aumenta
    - Consistência de dimensões (profundidade, altura, altura assento) entre medidas do mesmo produto
  - Highlight visual de erros em vermelho
- **Pedidos** — Gestão completa:
  - Lista de pedidos com filtros
  - Detalhes do pedido
  - Aprovação/Rejeição
  - Atualização de status
  - Canal de mensagens com cliente
  - E-mails transacionais automáticos

### Autenticação e Autorização
- Login/Registro com NextAuth
- Roles: ADMIN, OPERADOR, CLIENTE, FABRICA
- Proteção de rotas por role
- Redirecionamento automático baseado em role

### E-mails Transacionais
- Pedido solicitado (cliente)
- Novo pedido (fábrica)
- Pedido confirmado (cliente)
- Pedido rejeitado (cliente)
- Atualização de status (cliente)

## Usuários de Teste

Após rodar o seed (`npx prisma db seed`), os seguintes usuários estarão disponíveis:

- **Admin**: `admin@gmail.com` / `admin`
- **Operador**: `op@local` / `op`
- **Fábrica**: `fab@local` / `fab`
- **Cliente**: `cli@local` / `cli`

## APIs Principais

### Carrinho
- `GET /api/cart` — Obter carrinho do usuário
- `POST /api/cart/items` — Adicionar item
- `PUT /api/cart/items` — Atualizar item
- `DELETE /api/cart/items` — Remover item

### Checkout
- `POST /api/checkout` — Finalizar compra

### Pedidos
- `GET /api/meus-pedidos` — Listar pedidos do cliente
- `GET /api/meus-pedidos/[id]` — Detalhes do pedido
- `POST /api/meus-pedidos/[id]/mensagens` — Enviar mensagem
- `GET /api/admin/pedidos` — Listar todos os pedidos (admin)
- `GET /api/admin/pedidos/[id]` — Detalhes do pedido (admin)
- `POST /api/admin/pedidos/[id]/status` — Atualizar status
- `POST /api/admin/pedidos/[id]/mensagens` — Responder mensagem

### Preços
- `GET /api/preco?produtoId=X&medida=Y&tecidoId=Z` — Calcular preço dinâmico
- `GET /api/tabela-preco` — Listar todas as linhas de preço
- `PUT /api/tabela-preco` — Atualizar linhas de preço (upsert)

## Validações da Tabela de Preço

O sistema possui validações automáticas na tabela de preço global:

1. **Grades Crescentes**: Os preços devem seguir a ordem crescente: 1000 < 2000 < 3000 < 4000 < 5000 < 6000 < 7000 < Couro
2. **Metragem Crescente**: Para o mesmo produto, as metragens de tecido e couro devem aumentar conforme a medida aumenta
3. **Consistência de Dimensões**: Para o mesmo produto, os valores de Profundidade, Altura e Altura Assento devem ser iguais entre todas as medidas

Campos com erro são destacados em vermelho na interface.

## Scripts Disponíveis

- `npm run dev` — Servidor de desenvolvimento
- `npm run build` — Build de produção
- `npm run start` — Servidor de produção
- `npx prisma studio` — Interface visual do banco de dados
- `npx prisma migrate dev` — Criar nova migração
- `npx prisma db seed` — Popular banco com dados iniciais

## Desenvolvimento

### Fases Implementadas

- ✅ **Fase 1**: Base do projeto
- ✅ **Fase 2**: Schema Prisma e modelos
- ✅ **Fase 3**: Admin CRUD (Categorias, Famílias, Tecidos, Produtos)
- ✅ **Fase 4**: Variações e Tabela de Preço
- ✅ **Fase 5**: Autenticação e Autorização
- ✅ **Fase 6**: Integração com banco de dados
- ✅ **Fase 7**: Pedidos (Storefront + Admin)
- ✅ **Fase 8**: Storefront completo (Catálogo, PDP, Login, UX)
- ✅ **Fase 9**: Gestão Global de Tabela de Preço
- ✅ **Fase 10**: Validações e melhorias de UX

## Licença

Proprietário — Todos os direitos reservados

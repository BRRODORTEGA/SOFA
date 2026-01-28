# Corrigir erro P3015 – “Could not find the migration file at migration.sql”

Esse erro ocorre quando existem **pastas de migração sem o arquivo `migration.sql`** (pastas vazias ou incompletas). A correção é apagar a pasta `prisma/migrations` e gerar de novo a migração inicial.

## Passos

### 1. Fechar o que usa a pasta do projeto

- Pare o servidor Next.js (Ctrl+C no terminal onde está o `npm run dev`).
- Feche o Cursor/VS Code (opcional, mas ajuda se der “acesso negado”).
- Se estiver em OneDrive, pode pausar a sincronização dessa pasta enquanto corrige.

### 2. Apagar a pasta de migrações

Abra **PowerShell** (se precisar, “Executar como administrador”) e rode:

```powershell
cd "c:\Users\rodri\OneDrive\99.COMPARTILHADAS\IDEIAS AI\GIT PROJETOS\SOFA"
Remove-Item -Recurse -Force .\prisma\migrations
```

Se aparecer **“acesso negado”**:

- Feche o Cursor por completo e tente de novo.
- Ou abra o PowerShell **como administrador** (botão direito no menu Iniciar → “Windows PowerShell (Admin)”) e execute os dois comandos de novo.

### 3. Criar a migração inicial

Ainda no PowerShell, na pasta do projeto:

```powershell
npx prisma migrate dev --name init
```

Isso recria a pasta `prisma/migrations` e gera a primeira migração a partir do `schema.prisma` atual.

### 4. Subir o projeto de novo

```powershell
npm run dev
```

---

## Se o banco já tiver dados que você não quer perder

Nesse caso **não** use `migrate dev --name init` logo após apagar as pastas, porque isso pode tentar recriar o banco.

Duas opções seguras:

1. **Backup e “reset” controlado**  
   - Faça backup do banco (ex.: `pg_dump`).  
   - Depois de apagar `prisma/migrations`, use `npx prisma migrate dev --name init` e, se o Prisma avisar que vai recriar o banco, cancele e use a opção 2.

2. **Só recriar as migrações, sem dropar o banco**  
   - Apague `prisma/migrations` como no passo 2.  
   - Crie a migração “inicial” a partir do estado atual do banco e do schema:
     ```powershell
     New-Item -ItemType Directory -Force -Path prisma\migrations\0_init
     npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script | Out-File -Encoding utf8 prisma\migrations\0_init\migration.sql
     npx prisma migrate resolve --applied 0_init
     ```
   - Depois rode `npx prisma migrate dev` normalmente quando quiser novas migrações.

Se o banco `ai_sofa` estiver **vazio** ou for **só de desenvolvimento**, basta seguir os passos 1–4 normalmente.

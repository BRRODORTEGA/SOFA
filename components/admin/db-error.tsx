export default function DbError() {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-4">
      <h3 className="mb-2 font-semibold text-red-800">Erro de Conexão com o Banco de Dados</h3>
      <p className="mb-2 text-sm text-red-700">
        Não foi possível conectar ao PostgreSQL. Verifique:
      </p>
      <ul className="mb-4 list-inside list-disc text-sm text-red-700">
        <li>O PostgreSQL está rodando?</li>
        <li>A URL no arquivo <code className="rounded bg-red-100 px-1">.env</code> está correta?</li>
        <li>O banco de dados <code className="rounded bg-red-100 px-1">ai_sofa</code> existe?</li>
      </ul>
      <div className="rounded bg-white p-3 text-xs">
        <p className="mb-2 font-semibold">Para iniciar o PostgreSQL no Windows:</p>
        <ol className="list-inside list-decimal space-y-1">
          <li>Pressione <code className="rounded bg-gray-100 px-1">Win + R</code>, digite <code className="rounded bg-gray-100 px-1">services.msc</code></li>
          <li>Procure por <strong>postgresql</strong> ou <strong>PostgreSQL</strong></li>
          <li>Clique com botão direito e selecione <strong>Iniciar</strong></li>
        </ol>
        <p className="mt-3 font-semibold">Ou via PowerShell (como Administrador):</p>
        <code className="block rounded bg-gray-100 p-2 mt-1">Get-Service | Where-Object Name -like *postgres*</code>
        <code className="block rounded bg-gray-100 p-2 mt-1">Start-Service postgresql-x64-15</code>
        <p className="mt-3 font-semibold">Depois, crie o banco de dados:</p>
        <code className="block rounded bg-gray-100 p-2 mt-1">psql -U postgres -c &quot;CREATE DATABASE ai_sofa;&quot;</code>
        <p className="mt-3 font-semibold">E execute as migrações:</p>
        <code className="block rounded bg-gray-100 p-2 mt-1">npx prisma migrate dev --name init</code>
      </div>
      <p className="mt-3 text-xs text-gray-600">
        Consulte o arquivo <code className="rounded bg-gray-100 px-1">SETUP_DATABASE.md</code> para mais detalhes.
      </p>
    </div>
  );
}

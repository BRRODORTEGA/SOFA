export default function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">AI Sofá</h3>
            <p className="text-sm text-gray-600">
              Sofás sob medida com o conforto que você merece.
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Links</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/" className="hover:text-gray-900">
                  Início
                </a>
              </li>
              <li>
                <a href="/categorias" className="hover:text-gray-900">
                  Categorias
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Conta</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/auth/login" className="hover:text-gray-900">
                  Entrar
                </a>
              </li>
              <li>
                <a href="/meus-pedidos" className="hover:text-gray-900">
                  Meus Pedidos
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-gray-900">Contato</h3>
            <p className="text-sm text-gray-600">
              Entre em contato conosco através do canal de mensagens do seu pedido.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} AI Sofá. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}


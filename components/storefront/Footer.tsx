import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-1">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-xl font-light text-foreground">AI Sofá</h3>
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs">
              Sofás sob medida com o conforto que você merece. Qualidade, estilo e personalização em cada detalhe.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-base font-medium text-foreground">Navegação</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-light">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/categorias" className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-light">
                  Categorias
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-base font-medium text-foreground">Minha Conta</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-light">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/meus-pedidos" className="text-muted-foreground hover:text-foreground transition-colors duration-300 font-light">
                  Meus Pedidos
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-base font-medium text-foreground">Contato</h3>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              Entre em contato conosco através do canal de mensagens do seu pedido. Estamos sempre prontos para ajudar.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground font-light">
            © {new Date().getFullYear()} AI Sofá. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}


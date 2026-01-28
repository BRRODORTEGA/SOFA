import Link from "next/link";

const DEFAULT_TITULO = "AI Sofá";
const DEFAULT_DESCRICAO = "Sofás sob medida com o conforto que você merece. Qualidade, estilo e personalização em cada detalhe.";
const DEFAULT_CONTATO = "Entre em contato conosco através do canal de mensagens do seu pedido. Estamos sempre prontos para ajudar.";
const DEFAULT_COPYRIGHT = "© {ano} AI Sofá. Todos os direitos reservados.";

interface FooterConfig {
  titulo: string;
  descricao: string;
  contato: string;
  copyright: string;
}

interface FooterProps {
  config?: FooterConfig | null;
}

export default function Footer({ config }: FooterProps) {
  const titulo = config?.titulo ?? DEFAULT_TITULO;
  const descricao = config?.descricao ?? DEFAULT_DESCRICAO;
  const contato = config?.contato ?? DEFAULT_CONTATO;
  const copyrightRaw = config?.copyright ?? DEFAULT_COPYRIGHT;
  const copyright = copyrightRaw.replace("{ano}", String(new Date().getFullYear()));

  return (
    <footer className="border-t border-border bg-bg-1">
      <div className="mx-auto w-full px-4 md:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 text-xl font-light text-foreground">{titulo}</h3>
            <p className="text-sm text-muted-foreground font-light leading-relaxed max-w-xs">
              {descricao}
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
              {contato}
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground font-light">
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}


import Image from "next/image";
import Link from "next/link";

export default function NossaHistoriaPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 text-center">
          <span className="text-primary font-semibold tracking-wider uppercase text-sm">Desde a fundação</span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mt-4 mb-6">
            Nossa História
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Unindo a tradição do estofamento artesanal com a precisão da indústria moderna 
            para criar sofás que definem o conceito de bem-estar.
          </p>
        </div>
      </section>

      {/* Conteúdo Principal com a Imagem da Fábrica */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Imagem da Fábrica */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
               <Image 
                src="/institucional/fabrica.jpg" 
                alt="Nossa Fábrica de Sofás" 
                fill
                className="object-cover"
                priority
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">Excelência em cada detalhe</h2>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Nossa fábrica é o coração de tudo o que fazemos. Localizada em um polo industrial estratégico, 
                  investimos constantemente em tecnologia de ponta para garantir que cada corte de tecido e 
                  cada estrutura de madeira possuam precisão milimétrica.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Matéria-Prima Premium</h4>
                    <p className="text-slate-500">Madeira de reflorestamento tratada e espumas com certificação de densidade.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Controle de Qualidade Rigoroso</h4>
                    <p className="text-slate-500">Inspeção individual de costura e acabamento antes de cada entrega.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Frase de Impacto */}
      <section className="bg-slate-900 py-20 text-white overflow-hidden relative">
        <div className="mx-auto max-w-7xl px-4 text-center relative z-10">
          <blockquote className="text-2xl md:text-4xl font-light italic opacity-90">
            "Não fabricamos apenas sofás, criamos o cenário onde a vida acontece."
          </blockquote>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/institucional/fabrica.jpg')] bg-cover bg-center"></div>
      </section>

      {/* Botão de Ação */}
      <section className="py-24 text-center">
        <h2 className="text-3xl font-bold mb-8 text-slate-900">Conheça nosso trabalho de perto</h2>
        <Link 
          href="/pronta-entrega" 
          className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-1"
        >
          Ver Produtos Disponíveis
        </Link>
      </section>
    </div>
  );
}

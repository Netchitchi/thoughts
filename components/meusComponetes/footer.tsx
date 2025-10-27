import { PenLine } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              <span className="text-lg font-semibold">Thoughts</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">Partilhe as suas ideias com o mundo</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Sobre nós
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Preços
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Recursos</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Guias
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Ajuda
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Termos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition-colors">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Thoughts. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

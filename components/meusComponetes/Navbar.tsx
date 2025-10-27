"use client"

import { PenLine } from "lucide-react"
import { useEffect, useState } from "react"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <PenLine className="h-6 w-6" />
            <span className="text-xl font-semibold tracking-tight">Thoughts</span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#sobre" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sobre
            </a>
            <a
              href="#funcionalidades"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </a>
            <a href="#comunidade" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Comunidade
            </a>
          </div>

          {/* Botões */}
          <div className="flex items-center gap-3">
            <button className="text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 transition">
              Entrar
            </button>
            <button className="hidden sm:inline-flex text-sm px-4 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition">
              Começar a escrever
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

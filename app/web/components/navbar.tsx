"use client"
import { Button } from "@/components/ui/button"
import { Pen } from 'lucide-react';
import { useEffect, useState } from "react"

export default function Navbar (){

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handleScroll = () => {
      setScrolled( window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return(
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${ scrolled ? "border-b" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">
        <div className="flex justify-between items-center h-16">

          <div className="flex bg-amber-200">
            <Pen />
            <p>Thoughts</p>
          </div>

          <div className=" hidden md:flex items-center gap-8">
            <a href="" className="text-sm text-muted-foreground hover:text-foreground transition-colors"> Sobre </a>
            <a href="" className="text-sm text-muted-foreground hover:text-foreground transition-colors"> Funcionalidades </a>
            <a href="" className="text-sm text-muted-foreground hover:text-foreground transition-colors"> Comunidade </a>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" size="sm" className="">Entrar</Button>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex hover:bg-black hover:text-white">Começar a escrever </Button>
          </div>
        </div>
      </div>
    </nav>

  )
}
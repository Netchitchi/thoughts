"use client"

import { ArrowRight, Sparkles } from "lucide-react"
import { useEffect, useRef } from "react"

export function IntroSection() {
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up")
          }
        })
      },
      { threshold: 0.1 },
    )

    if (heroRef.current) {
      const elements = heroRef.current.querySelectorAll(".fade-in-element")
      elements.forEach((el) => observer.observe(el))
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8">

          <div className="fade-in-element inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Onde as ideias ganham vida</span>
          </div>

          <h1 className="fade-in-element text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-center leading-tight ">
             <span className="block">Partilhe as suas</span>
              <span className="relative inline-block mt-2">
               <span className="relative z-10">ideias com o mundo</span>
               <span className="absolute bottom-1 left-0 right-0 h-3 bg-accent/20 -rotate-1"></span>
             </span>
         </h1>


          <p className="fade-in-element text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty">
            Uma plataforma moderna para escritores e leitores. Publique artigos, descubra novos conhecimentos e
            conecte-se com uma comunidade apaixonada por ideias.
          </p>

          <div className="fade-in-element flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button className="group px-6 py-3 text-base font-medium rounded-md bg-black text-white hover:bg-gray-800 transition flex items-center">
              Começar gratuitamente
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button className="px-6 py-3 text-base font-medium rounded-md border border-gray-300 hover:bg-gray-100 transition">
              Explorar artigos
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full"></div>
        </div>
      </div>
    </section>
  )
}

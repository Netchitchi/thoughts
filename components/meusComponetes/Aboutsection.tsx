"use client"

import { useEffect, useRef, useState } from "react"

export function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="sobre" ref={sectionRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/30">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2
             className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-balance transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            >
             Uma plataforma feita para quem ama{" "}
             <span className="relative inline-block">
                <span className="relative z-10 text-muted-foreground">ler e escrever</span>
               <span className="absolute bottom-1 left-0 right-0 h-2 bg-accent/20"></span>
             </span>
            </h2>

            <div
              className={`space-y-4 text-lg text-muted-foreground leading-relaxed transition-all duration-700 delay-150 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <p>
                O <strong className="text-foreground">Thoughts</strong> é um espaço onde escritores e leitores se
                conectam através de ideias inspiradoras.
              </p>
              <p>
                Publique os seus artigos, descubra conteúdos relevantes e faça parte de uma comunidade apaixonada por
                conhecimento.
              </p>
            </div>
          </div>

          <div
            className={`relative transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src="imageabout.png"
                alt="Interface do Thoughts"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium shadow-lg transform translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                Interface intuitiva
              </div>
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium shadow-lg transform -translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 delay-75">
                Leitura imersiva
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

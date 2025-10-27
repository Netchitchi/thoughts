"use client"

import { useEffect, useRef, useState } from "react"
import { BookOpen, Users, Sparkles, TrendingUp } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Escreva livremente",
    description: "Editor intuitivo e minimalista que permite focar no que realmente importa: as suas ideias.",
  },
  {
    icon: Users,
    title: "Comunidade ativa",
    description: "Conecte-se com escritores e leitores que partilham os seus interesses e paixões.",
  },
  {
    icon: Sparkles,
    title: "Recomendações inteligentes",
    description: "Descubra conteúdos personalizados baseados nos seus interesses e histórico de leitura.",
  },
  {
    icon: TrendingUp,
    title: "Cresça como escritor",
    description: "Acompanhe o desempenho dos seus artigos e receba feedback da comunidade.",
  },
]

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="funcionalidades"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/20"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-20">
          <h2
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Construído para Impulsionar
            <br />
            <span className="text-muted-foreground">as Suas Ideias</span>
          </h2>
          <p
            className={`text-lg text-muted-foreground max-w-2xl mx-auto text-pretty transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Ferramentas simples e poderosas para escritores e leitores de todos os níveis
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              <div className="relative p-8 rounded-2xl bg-card border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5">
                {/*icons */}
                <div className="mb-6 w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                  <feature.icon className="h-7 w-7 text-muted-foreground" />
                </div>

                {/*Conteúdo*/}
                <h3 className="text-2xl font-semibold mb-3 group-hover:text-accent transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>

                {/* Subtle hover indicator */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-500" />

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

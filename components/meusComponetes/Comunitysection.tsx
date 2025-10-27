'use client'

import { useEffect, useRef, useState } from "react"
import { MessageSquare, Heart, Share2 } from "lucide-react"

const benefits = [
  {
    icon: MessageSquare,
    title: "Comentários e discussões",
    description: "Participe em conversas significativas sobre os temas que mais lhe interessam.",
  },
  {
    icon: Heart,
    title: "Apoie os seus escritores favoritos",
    description: "Mostre apreço pelos artigos que mais gosta e ajude os autores a crescer.",
  },
  {
    icon: Share2,
    title: "Partilhe facilmente",
    description: "Divulgue os melhores artigos com a sua rede e amplie o alcance das ideias.",
  },
]


export function CommunitySection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

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
      id="comunidade"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-6 mb-20">
          <h2
            className={`text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Conecte-se com a
            <br />
            <span className="text-muted-foreground">Comunidade Thoughts</span>
          </h2>
          <p
            className={`text-lg text-muted-foreground max-w-2xl mx-auto text-pretty transition-all duration-1000 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Junte-se a escritores e leitores que partilham as suas paixões
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`group relative transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${(index + 1) * 150}ms` }}
            >
              <div className="relative h-full p-8 rounded-2xl bg-card border border-border/50 hover:border-accent/50 transition-all duration-300 hover:shadow-xl hover:shadow-accent/5 text-center">
                {/* Icon */}
                <div className="mb-6 w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mx-auto group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                  <benefit.icon className="h-7 w-7 text-muted-foreground" />
                </div>

                {/* contéudo da seção comunidade */}
                <h3 className="text-xl font-semibold mb-3 group-hover:text-accent transition-colors duration-300">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{benefit.description}</p>

                {/* linha preta hover*/}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-black group-hover:w-full transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>

        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-12 transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full blur-3xl" />

          <div className="relative space-y-6 max-w-2xl mx-auto text-center">
            <h3 className="text-3xl sm:text-4xl font-bold text-primary-foreground text-balance">
              Pronto para começar a sua jornada?
            </h3>
            <p className="text-primary-foreground/90 leading-relaxed text-lg">
              Crie a sua conta gratuitamente e comece a partilhar as suas ideias com o mundo hoje mesmo.
            </p>
            <button
              className="mt-6 text-base font-medium px-8 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 transition-all duration-300"
            >
              Criar conta gratuita
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}   
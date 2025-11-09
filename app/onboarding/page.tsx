"use client"

import { supabase } from "@/packages/supabase-client/src/client";
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PenLine, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link";

 interface Category{
    id: string
    name: string
    description: string
  }

export default function Onboarding(){

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () =>{
    try{
      const {data, error} = await supabase.from("categories").select("*").order("name")

      if(error) throw error
      setCategories( data || [])
      console.log(data)

    }catch(error){
      console.log(" O seguinte erro foi detectado", error)
      setError("Erro ao carregar categorias")
    }finally{
      setIsLoading(false)
    }

  }
  
  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
    } else {
      newSelected.add(categoryId)
    }
    setSelectedCategories(newSelected)
  }

  const handleContinue = async () => {
    if (selectedCategories.size === 0) {
      setError("Selecione pelo menos um interesse")
      return
    }
    
    setIsSaving(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      const interests = Array.from(selectedCategories).map((categoryId) => ({
        user_id: user.id,
        category_id: categoryId,
      }))

      const { error } = await supabase.from("user_interests").insert(interests)

      if (error) throw error

      router.push("/feed")
    } catch (error) {
      console.error(" Error saving interests:", error)
      setError("Erro ao salvar interesses. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

   if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return(
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="container mx-auto max-w-4xl">
        <Link href="">
          <div className="mb-8 flex items-center justify-center gap-2 pt-8">
            <PenLine className="h-8 w-8" />
            <span className="text-2xl font-semibold tracking-tight">Thoughts</span>
          </div>
        </Link>
  
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">O que mais te interessa?</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecione os temas que gostaria de ver no seu feed. Pode escolher quantos quiser e alterar depois.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((category) => {
            const isSelected = selectedCategories.has(category.id)
            return (
              <Card
                key={category.id}
                className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                  isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleCategory(category.id)}
              >
                <div className="p-6">
                  {isSelected && (
                    <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="min-w-[200px]"
            onClick={handleContinue}
            disabled={isSaving || selectedCategories.size === 0}
          >
            {isSaving ? "Salvando..." : "Continuar"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {selectedCategories.size}{" "}
            {selectedCategories.size === 1 ? "interesse selecionado" : "interesses selecionados"}
          </p>
        </div>
      </div>
    </div>
  )
}


        

  
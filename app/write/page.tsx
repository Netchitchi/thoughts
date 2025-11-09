"use client"

import { supabase } from "@/packages/supabase-client/src/client"
import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Category {
  id: string
  name: string
}

export default function WritePage() {
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadCategories()
  }, [])

  // Carrega categorias
  const loadCategories = async () => {
    setIsLoading(true)
    try {
      
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name")

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
      setError("Erro ao carregar categorias.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    await handleSubmit(false)
  }

  const handlePublish = async () => {
    await handleSubmit(true)
  }

  //  Salvar ou publicar post
  const handleSubmit = async (publish: boolean) => {
    if (!title.trim()) {
      setError("O título é obrigatório.")
      return
    }

    if (!categoryId) {
      setError("Selecione uma categoria.")
      return
    }

    if (!content.trim()) {
      setError("O conteúdo é obrigatório.")
      return
    }

    setIsPublishing(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuário não autenticado.")

      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title: title.trim(),
            excerpt: excerpt.trim() || content.trim().substring(0, 200),
            content: content.trim(),
            category_id: categoryId,
            cover_image: coverImage || null,
            author_id: user.id,
            published: publish,
          },
        ])
        .select()
        .single()

      if (error) throw error

      router.push(publish ? `/post/${data.id}` : "/profile")
    } catch (error) {
      console.error("Erro ao salvar post:", error)
      setError("Erro ao salvar o post. Tente novamente.")
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Escrever novo post</h1>
          <p className="text-muted-foreground">
            Partilhe as suas ideias com a comunidade
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-base font-semibold">
              Título *
            </Label>
            <Input
              id="title"
              placeholder="Um título cativante para o seu artigo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 text-lg h-12"
              disabled={isPublishing}
            />
          </div>

          <div>
            <Label htmlFor="excerpt" className="text-base font-semibold">
              Subtítulo
            </Label>
            <Input
              id="excerpt"
              placeholder="Um breve resumo do seu artigo (opcional)"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-2"
              disabled={isPublishing}
            />
          </div>

          <div>
            <Label htmlFor="category" className="text-base font-semibold">
              Categoria *
            </Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={isPublishing || isLoading}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="coverImage" className="text-base font-semibold">
              Imagem de capa
            </Label>
            <div className="mt-2 space-y-3">
              <Input
                id="coverImage"
                type="url"
                placeholder="URL da imagem de capa (opcional)"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                disabled={isPublishing}
              />
              {coverImage && (
                <Card className="overflow-hidden">
                  <div className="aspect-video w-full bg-muted flex items-center justify-center">
                    <img
                      src={coverImage || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=400&width=800"
                      }}
                    />
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="content" className="text-base font-semibold">
              Conteúdo do artigo *
            </Label>
            <Textarea
              id="content"
              placeholder="Escreva o seu artigo aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 min-h-[400px] text-base leading-relaxed"
              disabled={isPublishing}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {content.length} caracteres
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="min-w-[120px]"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isPublishing}
            >
              Guardar rascunho
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.back()}
              disabled={isPublishing}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

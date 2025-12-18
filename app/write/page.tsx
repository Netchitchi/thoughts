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
import { Loader2, Upload } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"

interface Category {
  id: string
  name: string
}

function WritePageContent() {
  const [title, setTitle] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const articleId = searchParams.get("id")

  useEffect(() => {
    loadCategories()
    if (articleId) loadArticle()
  }, [articleId])

  // Carregar artigo para edição
  const loadArticle = async () => {
    if (!articleId) return
    setIsLoading(true)
    
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("article_id", articleId)
      .single()

    if (error) {
      console.error(error)
      setError("Erro ao carregar artigo para edição")
    } else if (data) {
      setTitle(data.title)
      setExcerpt(data.summary)
      setContent(data.content)
      setCoverImage(data.cover_url || "")
      // Precisamos encontrar a categoria. O artigo tem categories_id ou category_id?
      // No schema original (ver feed/page.tsx) parecia ter relation category:categories(name).
      // Mas no insert deve usar um ID. Vou assumir que a coluna na tabela articles é categories_id ou category_id.
      // O feed usa query.in("categories_id", ...). Então deve ser categories_id.
      setCategoryId(data.categories_id || "")
    }
    setIsLoading(false)
  }

  // 🧠 Carregar categorias do Supabase
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

  // 🖼️ Upload da imagem de capa
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Usuário não autenticado.")

      const fileName = `${user.id}/${Date.now()}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from("covers")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("covers").getPublicUrl(fileName)

      setCoverImage(publicUrl)
    } catch (error) {
      console.error("Erro no upload da imagem:", error)
      setError("Erro ao enviar a imagem.")
    } finally {
      setIsUploading(false)
    }
  }

  // 🧠 Submeter post (publicar ou guardar)
  const handleSubmit = async (publish: boolean) => {
    if (!title.trim()) return setError("O título é obrigatório.")
    if (!categoryId) return setError("Selecione uma categoria.")
    if (!content.trim()) return setError("O conteúdo é obrigatório.")

    setIsPublishing(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

    if (!user) throw new Error("Usuário não autenticado.")

    const payload = {
      title,
      summary: excerpt,
      content,
      categories_id: categoryId, // Assumindo que o nome da coluna é categories_id
      cover_url: coverImage,
      author_id: user.id,
      published: publish,
    }

    let error;

    if (articleId) {
      // Update
      const res = await supabase
        .from("articles")
        .update(payload)
        .eq("article_id", articleId)
      error = res.error
    } else {
      // Insert
      const res = await supabase
        .from("articles")
        .insert(payload)
      error = res.error
    }

    if (error) throw error

    router.push("/feed")
    router.refresh()
  } catch (error: any) {
    console.error("Erro ao salvar:", error)
    setError(error.message || "Erro ao salvar o artigo.")
  } finally {
    setIsPublishing(false)
  }
}

  return (
    <div className="min-h-screen bg-background pb-20">
      <AuthenticatedNavbar />
      
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">{articleId ? "Editar Artigo" : "Novo Artigo"}</h1>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleSubmit(false)}
              disabled={isPublishing}
            >
              Salvar Rascunho
            </Button>
            <Button 
              onClick={() => handleSubmit(true)}
              disabled={isPublishing}
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
          </div>
        </div>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="grid gap-8">
          {/* Capa */}
          <Card className="p-6">
            <Label className="mb-4 block">Capa do Artigo</Label>
            
            <div className="flex items-center gap-6">
              <div className="relative w-40 h-24 bg-muted rounded-md overflow-hidden flex items-center justify-center border border-dashed border-muted-foreground/50">
                {coverImage ? (
                  <img src={coverImage} className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              
              <div className="flex-1">
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Recomendado: 1200x630px (PNG ou JPG)
                </p>
              </div>
            </div>
          </Card>

          {/* Detalhes */}
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Um título cativante..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumo</Label>
              <Textarea
                id="excerpt"
                placeholder="Uma breve descrição do que se trata o artigo..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
              />
            </div>
          </Card>

          {/* Conteúdo */}
          <Card className="p-6 space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              placeholder="Escreva a sua história aqui..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-base"
            />
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function WritePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <WritePageContent />
    </Suspense>
  )
}

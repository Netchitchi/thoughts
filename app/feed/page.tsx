"use client"

import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase-client"
import { Eye, Heart } from "lucide-react"

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

interface Post {
  article_id: string
  title: string
  summary: string
  created_at: string
  views_count: number
  likes_count: number
  users: {
    name: string
    avatar_url: string | null
  }[]
  categories: {
    name: string
  }[]
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory])

  //  Buscar categorias
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description, created_at")

    if (error) {
      console.error(" Erro ao buscar categorias:", error)
    } else {
      setCategories(data ?? [])
    }
  }

  //  Buscar artigos
  //  Buscar artigos (versão robusta)
//  Buscar artigos (versão final corrigida)
const fetchPosts = async () => {
  try {
    setIsLoading(true)

    //  Usa aliases "author" e "category" para evitar conflitos no Supabase
    let query = supabase
      .from("articles")
      .select(`
        article_id,
        title,
        summary,
        created_at,
        views_count,
        likes_count,
        author:author_id (
          name,
          avatar_url
        ),
        category:categories_id (
          name
        )
      `)
      .order("created_at", { ascending: false })

    // Filtro de categoria
    if (selectedCategory) {
      query = query.eq("categories_id", selectedCategory)
    }

    const { data, error } = await query

    // caso tivermos erro no  Supabase
    if (error) {
      console.error(" Erro ao buscar posts:", error.message || error)
      setPosts([])
      return
    }

    if (!data || data.length === 0) {
      console.log(" Nenhum post encontrado.")
      setPosts([])
      return
    }

    //  Mapeia os dados para o formato correto
    const formattedPosts: Post[] = data.map((post: any) => ({
      article_id: post.article_id,
      title: post.title ?? "Sem título",
      summary: post.summary ?? "",
      created_at: post.created_at,
      views_count: post.views_count ?? 0,
      likes_count: post.likes_count ?? 0,
      users: post.author
        ? [{ name: post.author.name, avatar_url: post.author.avatar_url }]
        : [{ name: "Autor desconhecido", avatar_url: null }],
      categories: post.category
        ? [{ name: post.category.name }]
        : [{ name: "Sem categoria" }],
    }))

    console.log(" Posts carregados:", formattedPosts)
    setPosts(formattedPosts)
  } catch (err) {
    console.error(" Erro inesperado ao buscar posts:", err)
    setPosts([])
  } finally {
    setIsLoading(false)
  }
}



  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">

        {/*  Filtro de categorias */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Badge
            onClick={() => setSelectedCategory(null)}
            className={`cursor-pointer ${!selectedCategory ? "bg-primary text-white" : ""}`}
          >
            Todos
          </Badge>

          {categories.map((cat) => (
            <Badge
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`cursor-pointer ${selectedCategory === cat.id ? "bg-primary text-white" : ""}`}
            >
              {cat.name}
            </Badge>
          ))}
        </div>

        {/* Lista de artigos */}
        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground">Nenhum post encontrado</div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {posts.map((post) => (
              <Link
                key={post.article_id}
                href={`/post/${post.article_id}`}
                className="flex flex-col sm:flex-row justify-between items-start gap-6 py-8 hover:bg-muted/20 transition rounded-xl px-4"
              >
                {/* coluna esquerda com conteúdo */}
                <div className="flex-1">
                  {/* coloca o autor e data  de criação*/}
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={post.users?.[0]?.avatar_url || "/placeholder.svg"}
                      alt={post.users?.[0]?.name || "Autor"}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium">
                      {post.users?.[0]?.name || "Autor desconhecido"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      · {formatDate(post.created_at)}
                    </span>
                  </div>

                  {/* Título e Resumo */}
                  <h3 className="text-xl font-semibold mb-1 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-3 mb-3">
                    {post.summary}
                  </p>

                  {/* Categoria + Contadores */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {post.categories?.[0] && (
                      <Badge variant="secondary">
                        {post.categories[0].name}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.views_count}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes_count}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

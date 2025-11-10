"use client"

import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/packages/supabase-client"
import { Eye, Heart, Bookmark } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface Post {
  article_id: string
  title: string
  summary: string
  created_at: string
  views_count: number
  likes_count: number
  cover_url: string | null
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
  const [savedPosts, setSavedPosts] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("foryou") // começa no "For You"
  const [interests, setInterests] = useState<string[]>([])
  const searchParams = useSearchParams()

  // Detectar query param (ex: ?tab=featured)
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "featured" || tab === "foryou") {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    fetchCategories()
    fetchBookmarks()
    fetchUserInterests()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, activeTab, interests])

  // Buscar categorias
  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name")
    if (error) console.error("Erro ao buscar categorias:", error)
    else setCategories(data ?? [])
  }

  // Buscar interesses do usuário
  const fetchUserInterests = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("user_interests")
      .select("category_id")
      .eq("user_id", user.id)

    if (error) console.error("Erro ao buscar interesses:", error)
    else setInterests(data.map((i) => i.category_id))
  }

  // Buscar artigos
  const fetchPosts = async () => {
    try {
      setIsLoading(true)

      let query = supabase
        .from("articles")
        .select(`
          article_id,
          title,
          summary,
          created_at,
          views_count,
          likes_count,
          cover_url,
          author:users!articles_author_id_fkey(name, avatar_url),
          category:categories(name, id)
        `)

      // Aba "For You": filtrar pelos interesses do usuário
      if (activeTab === "foryou") {
        if (interests.length > 0) {
          query = query
            .in("categories_id", interests)
            .order("created_at", { ascending: false })
        } else {
          setPosts([])
          setIsLoading(false)
          return
        }
      }

      // Aba "Em Destaque": ordenar por mais curtidos
      if (activeTab === "featured") {
        query = query.order("likes_count", { ascending: false })
        if (selectedCategory) {
          query = query.eq("categories_id", selectedCategory)
        }
      }

      const { data, error } = await query

      if (error) {
        console.error("Erro ao buscar posts:", error)
        setPosts([])
        return
      }

      if (!data || data.length === 0) {
        setPosts([])
        return
      }

      const formattedPosts: Post[] = data.map((post: any) => ({
        article_id: post.article_id,
        title: post.title ?? "Sem título",
        summary: post.summary ?? "",
        created_at: post.created_at,
        views_count: post.views_count ?? 0,
        likes_count: post.likes_count ?? 0,
        cover_url: post.cover_url ?? null,
        users: post.author
          ? [{ name: post.author.name, avatar_url: post.author.avatar_url }]
          : [{ name: "Autor desconhecido", avatar_url: null }],
        categories: post.category
          ? [{ name: post.category.name }]
          : [{ name: "Sem categoria" }],
      }))

      setPosts(formattedPosts)
    } catch (err) {
      console.error("Erro inesperado ao buscar posts:", err)
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar posts salvos
  const fetchBookmarks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("bookmarks")
      .select("article_id")
      .eq("user_id", user.id)

    if (error) console.error("Erro ao buscar bookmarks:", error)
    else setSavedPosts(data.map((b) => b.article_id))
  }

  // Alternar salvar/remover post
  const toggleBookmark = async (articleId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert("É preciso fazer login para guardar um post.")
      return
    }

    const isSaved = savedPosts.includes(articleId)

    if (isSaved) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("article_id", articleId)

      if (!error) setSavedPosts(savedPosts.filter((id) => id !== articleId))
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert([{ user_id: user.id, article_id: articleId }])

      if (!error) setSavedPosts([...savedPosts, articleId])
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
    })

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
        {/* Tabs principais */}
        <Tabs
          defaultValue="foryou"
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-6"
        >
          <TabsList className="flex justify-center bg-muted rounded-lg p-1">
            <TabsTrigger
              value="foryou"
              className="data-[state=active]:bg-primary data-[state=active]:text-white transition"
            >
              For You
            </TabsTrigger>
            <TabsTrigger
              value="featured"
              className="data-[state=active]:bg-primary data-[state=active]:text-white transition"
            >
              Em Destaque
            </TabsTrigger>
          </TabsList>

          {/* For You */}
          <TabsContent value="foryou">
            {interests.length === 0 ? (
              <div className="text-center text-muted-foreground py-20">
                💡 Escolha alguns interesses nas configurações para personalizar
                o seu feed.
              </div>
            ) : posts.length === 0 && !isLoading ? (
              <div className="text-center text-muted-foreground py-20">
                Ainda não há posts nessas categorias. Tenta voltar mais tarde!
              </div>
            ) : (
              <PostList
                posts={posts}
                isLoading={isLoading}
                savedPosts={savedPosts}
                toggleBookmark={toggleBookmark}
                formatDate={formatDate}
              />
            )}
          </TabsContent>

          {/* Em Destaque */}
          <TabsContent value="featured">
            <div className="flex flex-wrap gap-2 mb-8 justify-center m-4">
              <Badge
                onClick={() => setSelectedCategory(null)}
                className={`cursor-pointer ${
                  !selectedCategory ? "bg-primary text-white" : ""
                }`}
              >
                Todos
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-primary text-white"
                      : ""
                  }`}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>

            <PostList
              posts={posts}
              isLoading={isLoading}
              savedPosts={savedPosts}
              toggleBookmark={toggleBookmark}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/* 🧱 Subcomponente — lista de posts no estilo Medium */
function PostList({
  posts,
  isLoading,
  savedPosts,
  toggleBookmark,
  formatDate,
}: {
  posts: Post[]
  isLoading: boolean
  savedPosts: string[]
  toggleBookmark: (articleId: string) => Promise<void>
  formatDate: (dateString: string) => string
}) {
  if (isLoading)
    return (
      <div className="text-center text-muted-foreground py-10">
        Carregando posts...
      </div>
    )

  if (posts.length === 0)
    return (
      <div className="text-center text-muted-foreground py-10">
        Nenhum post encontrado.
      </div>
    )

  return (
    <div className="flex flex-col divide-y divide-border">
      {posts.map((post) => (
        <Link
          key={post.article_id}
          href={`/article/${post.article_id}`}
          className="group flex flex-col sm:flex-row justify-between gap-6 py-10 hover:bg-muted/10 transition rounded-2xl px-4 sm:px-6"
        >
          {/* Lado Esquerdo — Texto */}
          <div className="flex flex-col justify-between flex-1 pr-4">
            {/* Autor */}
            <div className="flex items-center gap-2 mb-2">
              <img
                src={post.users?.[0]?.avatar_url || "/placeholder.svg"}
                alt={post.users?.[0]?.name || "Autor"}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="font-medium text-sm text-foreground">
                {post.users?.[0]?.name || "Autor desconhecido"}
              </span>
            </div>

            {/* Título e resumo */}
            <div>
              <h3 className="text-2xl font-bold leading-snug mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-muted-foreground text-base leading-relaxed line-clamp-2">
                {post.summary}
              </p>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{formatDate(post.created_at)}</span>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{post.views_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{post.likes_count}</span>
                </div>
              </div>

              {/* Botão Guardar */}
              <button
                onClick={async (e) => {
                  e.preventDefault()
                  await toggleBookmark(post.article_id)
                }}
                className={`flex items-center justify-center w-8 h-8 border rounded-full transition ${
                  savedPosts.includes(post.article_id)
                    ? "bg-primary text-white"
                    : "hover:bg-primary/10"
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 ${
                    savedPosts.includes(post.article_id)
                      ? "fill-white"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Lado Direito — Imagem */}
          {post.cover_url && (
            <div className="w-full sm:w-48 h-32 sm:h-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              <img
                src={post.cover_url}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
        </Link>
      ))}
    </div>
  )
}

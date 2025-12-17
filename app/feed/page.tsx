"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/packages/supabase-client/src/client"

import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Eye, Heart, Bookmark, Image as ImageIcon } from "lucide-react"

/*           TYPES               */

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


/*         FEED PAGE             */

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [savedPosts, setSavedPosts] = useState<string[]>([])
  const [likedPosts, setLikedPosts] = useState<string[]>([])

  const [activeTab, setActiveTab] = useState<"foryou" | "featured">("foryou")
  const [interests, setInterests] = useState<string[]>([])

  const searchParams = useSearchParams()

  /* ----------- QUERY TAB VIA URL (?tab=featured) ------------ */
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "featured" || tab === "foryou") {
      setActiveTab(tab)
    }
  }, [searchParams])

  /* ----------- LOAD INICIAL ------------ */
  useEffect(() => {
    fetchCategories()
    fetchBookmarks()
    fetchUserLikes()
    fetchUserInterests()
  }, [])

  /* Atualiza posts quando filtros mudam */
  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, activeTab, interests])

  /*  REFRESH QUANDO O USER VOLTA AO FEED */
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") {
        fetchPosts()
        fetchUserLikes()
      }
    }

    document.addEventListener("visibilitychange", handler)
    return () => document.removeEventListener("visibilitychange", handler)
  }, [])

  
  /*Fetch function */

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("id, name").order("name")
    if (!error) setCategories(data ?? [])
  }

  const fetchUserInterests = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("user_interests")
      .select("category_id")
      .eq("user_id", user.id)

    if (!error) setInterests(data.map((i) => i.category_id))
  }

  const fetchBookmarks = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from("bookmarks").select("article_id").eq("user_id", user.id)

    if (!error) setSavedPosts(data.map((b) => b.article_id))
  }

  const fetchUserLikes = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase.from("article_likes").select("article_id").eq("user_id", user.id)

    if (!error) setLikedPosts(data.map((row) => row.article_id))
  }

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

      // For You (personalizado)
      if (activeTab === "foryou") {
        if (interests.length > 0) {
          query = query.in("categories_id", interests).order("created_at", { ascending: false })
        } else {
          setPosts([])
          setIsLoading(false)
          return
        }
      }

      // Em destaque (mais likes)
      if (activeTab === "featured") {
        query = query.order("likes_count", { ascending: false })
        if (selectedCategory) query = query.eq("categories_id", selectedCategory)
      }

      const { data, error } = await query

      if (error || !data) return setPosts([])

      const formatted: Post[] = data.map((post: any) => ({
        article_id: post.article_id,
        title: post.title,
        summary: post.summary,
        created_at: post.created_at,
        views_count: post.views_count,
        likes_count: post.likes_count,
        cover_url: post.cover_url,
        users: [{ name: post.author?.name, avatar_url: post.author?.avatar_url }],
        categories: post.category ? [{ name: post.category.name }] : [],
      }))

      setPosts(formatted)
    } finally {
      setIsLoading(false)
    }
  }

 
  /* toogle bookmark */

  const toggleBookmark = async (articleId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return alert("Precisas de iniciar sessão para guardar um post.")

    const isSaved = savedPosts.includes(articleId)

    if (isSaved) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("article_id", articleId)
      setSavedPosts(savedPosts.filter((id) => id !== articleId))
    } else {
      await supabase.from("bookmarks").insert([{ user_id: user.id, article_id: articleId }])
      setSavedPosts([...savedPosts, articleId])
    }
  }


  /*  Like no feed */

const toggleLikeOnFeed = async (articleId: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    alert("Precisas de iniciar sessão para deixar like.")
    return
  }

  const alreadyLiked = likedPosts.includes(articleId)

  try {
    if (alreadyLiked) {
      //  remover like
      await supabase
        .from("article_likes")
        .delete()
        .eq("article_id", articleId)
        .eq("user_id", user.id)
    } else {
      //  inserir like
      await supabase
        .from("article_likes")
        .insert({
          article_id: articleId,
          user_id: user.id,
        })
    }

    // 🔄 sincronizar estado (triggers já atualizaram likes_count)
    await fetchPosts()
    await fetchUserLikes()

  } catch (error) {
    console.error("Erro ao alternar like:", error)
  }
}



  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })


  
  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
        <Tabs
          defaultValue="foryou"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "foryou" | "featured")}
          className="mb-6"
        >
          <TabsList className="flex justify-center bg-muted rounded-lg p-1">
            <TabsTrigger value="foryou">For You</TabsTrigger>
            <TabsTrigger value="featured">Em Destaque</TabsTrigger>
          </TabsList>

          <TabsContent value="foryou">
            {interests.length === 0 ? (
              <div className="text-center text-muted-foreground py-20">
                Escolhe alguns interesses para personalizar o feed.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                   <p className="w-full text-center text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Os teus interesses</p>
                   {categories
                     .filter(cat => interests.includes(cat.id))
                     .map(cat => (
                       <Badge key={cat.id} variant="secondary" className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                         {cat.name}
                       </Badge>
                     ))
                   }
                </div>
                <PostList
                  posts={posts}
                  isLoading={isLoading}
                  savedPosts={savedPosts}
                  likedPosts={likedPosts}
                  toggleBookmark={toggleBookmark}
                  toggleLike={toggleLikeOnFeed}
                  formatDate={formatDate}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="featured">
            <div className="flex flex-wrap gap-2 mb-8 justify-center m-4">
              <Badge
                onClick={() => setSelectedCategory(null)}
                className={!selectedCategory ? "bg-primary text-white" : ""}
              >
                Todos
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={selectedCategory === cat.id ? "bg-primary text-white" : ""}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>

            <PostList
              posts={posts}
              isLoading={isLoading}
              savedPosts={savedPosts}
              likedPosts={likedPosts}
              toggleBookmark={toggleBookmark}
              toggleLike={toggleLikeOnFeed}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


function PostList({
  posts,
  isLoading,
  savedPosts,
  likedPosts,
  toggleBookmark,
  toggleLike,
  formatDate,
}: {
  posts: Post[]
  isLoading: boolean
  savedPosts: string[]
  likedPosts: string[]
  toggleBookmark: (id: string) => Promise<void>
  toggleLike: (id: string) => Promise<void>
  formatDate: (date: string) => string
}) {
  if (isLoading)
    return <div className="py-10 text-center text-muted-foreground">Carregando posts...</div>

  if (posts.length === 0)
    return <div className="py-10 text-center text-muted-foreground">Nenhum post encontrado.</div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => {
        const isSaved = savedPosts.includes(post.article_id)
        const isLiked = likedPosts.includes(post.article_id)

        return (
          <Link
            key={post.article_id}
            href={`/article/${post.article_id}`}
            className="group flex flex-col bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-lg transition"
          >
            {/* imagem */}
            <div className="h-40 w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60 overflow-hidden">
              {post.cover_url ? (
                <img
                  src={post.cover_url}
                  alt={post.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <ImageIcon className="w-14 h-14 text-muted-foreground/40" />
              )}
            </div>

            {/* Conteúdo */}
            <div className="p-4 flex flex-col flex-grow">
              {/* Autor */}
              <div className="flex items-center gap-2 mb-3">
                <img
                  src={post.users[0]?.avatar_url || "/placeholder.svg"}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">{post.users[0]?.name}</span>
              </div>

              {/* Título */}
              <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition">
                {post.title}
              </h3>

              {/* Resumo */}
              <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                {post.summary}
              </p>

              {/* Rodapé */}
              <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                <span>{formatDate(post.created_at)}</span>

                <div className="flex items-center gap-3">
                  {/* Views */}
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.views_count}</span>
                  </div>

                  {/* Like */}
                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      await toggleLike(post.article_id)
                    }}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isLiked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    <span>{post.likes_count}</span>
                  </button>

                  {/* Bookmark */}
                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      await toggleBookmark(post.article_id)
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                      isSaved ? "bg-primary text-white" : "hover:bg-primary/10"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isSaved ? "fill-white" : ""}`} />
                  </button>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
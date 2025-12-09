"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/packages/supabase-client/src/client"

import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Eye, Heart, Bookmark } from "lucide-react"

/* ============================= */
/*           TYPES               */
/* ============================= */

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

  /* ----------- Atualiza posts quando filtros mudam ------------ */
  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, activeTab, interests])

  /* ----------- REFRESH QUANDO O USER VOLTA AO FEED ------------ */
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

  
  /*         FETCH FUNCTIONS       */

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

 
  /*       TOGGLE BOOKMARK         */

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


  /*         LIKE NO FEED          */

  const toggleLikeOnFeed = async (articleId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return alert("Precisas de iniciar sessão para deixar like.")

    const alreadyLiked = likedPosts.includes(articleId)
    const post = posts.find((p) => p.article_id === articleId)
    if (!post) return

    if (alreadyLiked) {
      await supabase.from("article_likes").delete().eq("article_id", articleId).eq("user_id", user.id)

      await supabase
        .from("articles")
        .update({ likes_count: Math.max(post.likes_count - 1, 0) })
        .eq("article_id", articleId)

      setLikedPosts(likedPosts.filter((id) => id !== articleId))
      setPosts((prev) =>
        prev.map((p) => (p.article_id === articleId ? { ...p, likes_count: p.likes_count - 1 } : p))
      )
    } else {
      await supabase.from("article_likes").insert({ article_id: articleId, user_id: user.id })

      await supabase
        .from("articles")
        .update({ likes_count: post.likes_count + 1 })
        .eq("article_id", articleId)

      setLikedPosts([...likedPosts, articleId])
      setPosts((prev) =>
        prev.map((p) => (p.article_id === articleId ? { ...p, likes_count: p.likes_count + 1 } : p))
      )
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })


  /*             RENDER            */
  
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
              <PostList
                posts={posts}
                isLoading={isLoading}
                savedPosts={savedPosts}
                likedPosts={likedPosts}
                toggleBookmark={toggleBookmark}
                toggleLike={toggleLikeOnFeed}
                formatDate={formatDate}
              />
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
    <div className="flex flex-col divide-y divide-border">
      {posts.map((post) => {
        const isSaved = savedPosts.includes(post.article_id)
        const isLiked = likedPosts.includes(post.article_id)

        return (
          <Link
            key={post.article_id}
            href={`/article/${post.article_id}`}
            className="group flex flex-col sm:flex-row justify-between gap-6 py-10 hover:bg-muted/10 transition rounded-2xl px-4 sm:px-6"
          >
            {/* Texto */}
            <div className="flex flex-col justify-between flex-1 pr-4">
              {/* Autor */}
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={post.users[0]?.avatar_url || "/placeholder.svg"}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">{post.users[0]?.name}</span>
              </div>

              {/* Título */}
              <div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition">
                  {post.title}
                </h3>
                <p className="text-muted-foreground line-clamp-2">{post.summary}</p>
              </div>

              {/* Rodapé */}
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{formatDate(post.created_at)}</span>

                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.views_count}</span>
                  </div>

                  {/* LIKE NO FEED */}
                  <button
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      await toggleLike(post.article_id)
                    }}
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
                    <span>{post.likes_count}</span>
                  </button>
                </div>

                {/* BOOKMARK */}
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

            {/* Imagem */}
            {post.cover_url && (
              <div className="w-full sm:w-48 h-32 rounded-md overflow-hidden bg-muted">
                <img
                  src={post.cover_url}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}

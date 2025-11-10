"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase-client/src/client"
import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Bookmark, MessageCircle, Share2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"


interface Article {
  article_id: string
  title: string
  content: string
  cover_url: string | null
  created_at: string
  views_count: number
  likes_count: number
  author: {
    user_id: string
    name: string
    avatar_url: string | null
    bio: string | null
  }
  category: {
    name: string
  } | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    name: string
    avatar_url: string | null
  }
}

interface SuggestedArticle {
  article_id: string
  title: string
  summary: string
  cover_url: string | null
  author: {
    name: string
  }
}


type MaybeArray<T> = T | T[] | null

function pickOne<T>(value: MaybeArray<T>): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}


export default function ArticleDetailPage() {
  const params = useParams()
  const articleId = params.id as string

  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [suggested, setSuggested] = useState<SuggestedArticle[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)


  useEffect(() => {
    if (articleId) {
      loadArticle()
      loadComments()
      loadSuggested()
      checkUserInteractions()
      incrementViews()
    }
  }, [articleId])


  const loadArticle = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          article_id,
          title,
          content,
          cover_url,
          created_at,
          views_count,
          likes_count,
          author:users!articles_author_id_fkey(user_id, name, avatar_url, bio),
          category:categories(id, name)
        `)
        .eq("article_id", articleId)
        .single()

      if (error) throw error
      if (!data) return

      const author = pickOne(data.author)
      const category = pickOne(data.category)

      const mapped: Article = {
        article_id: data.article_id,
        title: data.title,
        content: data.content,
        cover_url: data.cover_url,
        created_at: data.created_at,
        views_count: data.views_count ?? 0,
        likes_count: data.likes_count ?? 0,
        author: {
          user_id: author?.user_id ?? "",
          name: author?.name ?? "Autor desconhecido",
          avatar_url: author?.avatar_url ?? null,
          bio: author?.bio ?? null,
        },
        category: category ? { name: category.name } : null,
      }

      setArticle(mapped)
      setLikesCount(mapped.likes_count)
    } catch (error) {
      console.error("Erro ao carregar artigo:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user:users(user_id, name, avatar_url)
        `)
        .eq("article_id", articleId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const mapped: Comment[] =
        data?.map((row: any) => {
          const user = pickOne(row.user)
          return {
            id: row.id,
            content: row.content,
            created_at: row.created_at,
            user: {
              name: user?.name ?? "Usuário",
              avatar_url: user?.avatar_url ?? null,
            },
          }
        }) ?? []

      setComments(mapped)
    } catch (error) {
      console.error("Erro ao carregar comentários:", error)
    }
  }

  const loadSuggested = async () => {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          article_id,
          title,
          summary,
          cover_url,
          author:users(name)
        `)
        .eq("status", "published")
        .neq("article_id", articleId)
        .limit(3)

      if (error) throw error

      const mapped: SuggestedArticle[] =
        data?.map((row: any) => {
          const author = pickOne(row.author)
          return {
            article_id: row.article_id,
            title: row.title,
            summary: row.summary,
            cover_url: row.cover_url ?? null,
            author: { name: author?.name ?? "Autor" },
          }
        }) ?? []

      setSuggested(mapped)
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error)
    }
  }

  const checkUserInteractions = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: bookmark } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .maybeSingle()

      setIsBookmarked(!!bookmark)
    } catch (error) {
      console.error("Erro ao verificar interações:", error)
    }
  }

  const incrementViews = async () => {
    try {
      await supabase.rpc("increment_article_views", { article_id: articleId })
    } catch (error) {
      console.error("Erro ao incrementar visualizações:", error)
    }
  }

  const toggleLike = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !article) return

      if (isLiked) {
        await supabase.rpc("decrement_article_likes", { article_id: article.article_id })
        setLikesCount((prev) => Math.max(0, prev - 1))
      } else {
        await supabase.rpc("increment_article_likes", { article_id: article.article_id })
        setLikesCount((prev) => prev + 1)
      }

      setIsLiked(!isLiked)
    } catch (error) {
      console.error("Erro ao curtir:", error)
    }
  }

  const toggleBookmark = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      if (isBookmarked) {
        await supabase.from("bookmarks").delete().eq("article_id", articleId).eq("user_id", user.id)
      } else {
        await supabase.from("bookmarks").insert({ article_id: articleId, user_id: user.id })
      }

      setIsBookmarked(!isBookmarked)
    } catch (error) {
      console.error("Erro ao guardar artigo:", error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase.from("comments").insert({
        content: newComment,
        article_id: articleId,
        user_id: user.id,
      })

      if (error) throw error
      setNewComment("")
      loadComments()
    } catch (error) {
      console.error("Erro ao enviar comentário:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  /* Utilitários*/
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  /* =========================================================
     Render
     ========================================================= */
  if (isLoading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <AuthenticatedNavbar />
        <p className="text-muted-foreground">Carregando artigo...</p>
      </div>
    )

  if (!article)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <AuthenticatedNavbar />
        <p className="text-muted-foreground">Artigo não encontrado.</p>
      </div>
    )

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <article className="max-w-3xl mx-auto px-4 py-10">
        {/* Categoria */}
        {article.category && (
          <p className="text-sm uppercase text-primary font-semibold tracking-wide mb-3">
            {article.category.name}
          </p>
        )}

        {/* Título */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          {article.title}
        </h1>

        {/* Autor */}
        <div className="flex items-center gap-3 mb-8">
          <Avatar className="h-10 w-10">
            <AvatarImage src={article.author.avatar_url || undefined} />
            <AvatarFallback>{getInitials(article.author.name)}</AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/profile/${article.author.user_id}`}
              className="font-medium hover:underline"
            >
              {article.author.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {formatDate(article.created_at)} — {article.views_count} visualizações
            </p>
          </div>
        </div>

        {/* Capa */}
        {article.cover_url && (
          <div className="rounded-xl overflow-hidden mb-8">
            <img
              src={article.cover_url}
              alt={article.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        {/* Conteúdo */}
        <div className="prose prose-lg max-w-none mb-12 text-foreground leading-relaxed">
          {article.content.split("\n").map((para, i) => (
            <p key={i} className="mb-5">
              {para}
            </p>
          ))}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-4 border-t pt-6 mb-12">
          <Button
            variant={isLiked ? "default" : "outline"}
            size="sm"
            onClick={toggleLike}
            className="gap-2"
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            {likesCount}
          </Button>

          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <MessageCircle className="h-4 w-4" />
            {comments.length}
          </Button>

          <Button
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={toggleBookmark}
          >
            <Bookmark
              className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`}
            />
          </Button>

          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Comentários */}
        <section className="border-t pt-10 mb-16">
          <h2 className="text-2xl font-semibold mb-6">
            Comentários ({comments.length})
          </h2>

          <form onSubmit={handleSubmitComment} className="mb-8">
            <Textarea
              placeholder="Escreve um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="mb-3"
              rows={3}
            />
            <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
              {isSubmitting ? "A publicar..." : "Publicar"}
            </Button>
          </form>

          <div className="space-y-6">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={c.user.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(c.user.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{c.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(c.created_at)}
                  </p>
                  <p className="mt-1 text-sm">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sugestões */}
        {suggested.length > 0 && (
          <section className="border-t pt-10">
            <h2 className="text-2xl font-semibold mb-8">
              Outros artigos que pode gostar
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {suggested.map((s) => (
                <Link
                  key={s.article_id}
                  href={`/article/${s.article_id}`}
                  className="block group"
                >
                  <div className="rounded-lg overflow-hidden mb-3">
                    {s.cover_url && (
                      <img
                        src={s.cover_url}
                        alt={s.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                      />
                    )}
                  </div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors mb-1">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                    {s.summary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.author.name}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  )
}

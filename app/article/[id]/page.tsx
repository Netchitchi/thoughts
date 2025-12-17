"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/packages/supabase-client/src/client"

import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, HeartOff, Pencil, Trash2 } from "lucide-react"

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
  category: { name: string } | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  user: {
    name: string
    avatar_url: string | null
  }
}

type MaybeArray<T> = T | T[] | null
function pickOne<T>(value: MaybeArray<T>): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

import { incrementViewAction } from "../actions"

export default function ArticleDetailPage() {
  const params = useParams()
  const articleId = params.id as string

  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasLiked, setHasLiked] = useState(false)

  // edição de comentários
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  /* USER ATUAL */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user)
    })
  }, [])

  /*REGISTAR VISUALIZAÇÃO COM DELAY */
  useEffect(() => {
    if (!articleId) return

    const timeout = setTimeout(async () => {
      // 1. Tentar registar leitura única se estiver logado (Histórico)
      if (currentUser) {
         await supabase
          .from("user_reads")
          .upsert(
            {
              user_id: currentUser.id,
              article_id: articleId,
            },
            {
              onConflict: "user_id,article_id",
            }
          )
      }

      // 2. Incrementar contador via Server Action (Revalida cache)
      await incrementViewAction(articleId);
      
    }, 2000) // ⏱️ 2 segundos (mais rápido para garantir que conta)

    return () => clearTimeout(timeout)
  }, [articleId, currentUser])


  /*  FIX: Recarregar quando voltar do feed */
  useEffect(() => {
    const reloadOnReturn = () => {
      loadArticle()
      checkIfUserLiked()
    }

    window.addEventListener("popstate", reloadOnReturn)
    document.addEventListener("visibilitychange", reloadOnReturn)

    return () => {
      window.removeEventListener("popstate", reloadOnReturn)
      document.removeEventListener("visibilitychange", reloadOnReturn)
    }
  }, [])

  /*  CARREGAR DADOS  */
  useEffect(() => {
    if (!articleId) return
    loadArticle()
    loadComments()

    if (currentUser) checkIfUserLiked()
    else setHasLiked(false)
  }, [articleId, currentUser])

  /* Buscar artigo*/
  const loadArticle = async () => {
    setIsLoading(true)
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
        author:users(user_id, name, avatar_url, bio),
        category:categories(id, name)
      `)
      .eq("article_id", articleId)
      .single()

    if (error || !data) {
      console.error("Erro ao carregar artigo:", error)
      setIsLoading(false)
      return
    }

    const author = pickOne(data.author)
    const category = pickOne(data.category)

    setArticle({
      ...data,
      author: {
        user_id: author?.user_id ?? "",
        name: author?.name ?? "",
        avatar_url: author?.avatar_url ?? null,
        bio: author?.bio ?? null,
      },
      category: category ? { name: category.name } : null,
    })

    setIsLoading(false)
  }

  /* ver se o utilizador já deu like */
  const checkIfUserLiked = async () => {
    if (!currentUser) return

    const { data } = await supabase
      .from("article_likes")
      .select("id")
      .eq("article_id", articleId)
      .eq("user_id", currentUser.id)
      .maybeSingle()

    setHasLiked(!!data)
  }

  /* ----------- LIKE / UNLIKE  */

const toggleLike = async () => {
  if (!currentUser || !article) return

  try {
    if (hasLiked) {
      // remover like
      await supabase
        .from("article_likes")
        .delete()
        .eq("article_id", article.article_id)
        .eq("user_id", currentUser.id)
    } else {

      // inserir like
      await supabase
        .from("article_likes")
        .insert({
          article_id: article.article_id,
          user_id: currentUser.id,
        })
    }

    //  sincronizar estado (triggers já atualizaram likes_count)
    await loadArticle()
    await checkIfUserLiked()

  } catch (error) {
    console.error("Erro ao alternar like:", error)
  }
}



  /* COMENTÁRIOS  */
  const loadComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        user:users(user_id, name, avatar_url)
      `)
      .eq("article_id", articleId)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setComments(
        data.map((row: any) => {
          const user = pickOne(row.user)
          return {
            id: row.id,
            content: row.content,
            created_at: row.created_at,
            user_id: row.user_id,
            user: {
              name: user?.name ?? "Usuário",
              avatar_url: user?.avatar_url ?? null,
            },
          }
        })
      )
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!currentUser) return

    await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", currentUser.id)

    loadComments()
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("comments").insert({
      content: newComment,
      article_id: articleId,
      user_id: user.id,
    })

    setNewComment("")
    loadComments()
    setIsSubmitting(false)
  }

  const startEditing = (c: Comment) => {
    setEditingId(c.id)
    setEditingContent(c.content)
  }

  const saveEdit = async () => {
    if (!editingId || !currentUser) return

    await supabase
      .from("comments")
      .update({ content: editingContent })
      .eq("id", editingId)
      .eq("user_id", currentUser.id)

    setEditingId(null)
    setEditingContent("")
    loadComments()
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent("")
  }



  if (isLoading || !article)
    return <div className="p-10 text-center">Carregando...</div>

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <article className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>

        {article.cover_url && (
          <img src={article.cover_url} className="rounded-xl mb-8 w-full" />
        )}

        {/* like */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            onClick={toggleLike}
            className="flex items-center gap-2"
            variant={hasLiked ? "destructive" : "default"}
          >
            {hasLiked ? (
              <>
                <HeartOff className="w-4 h-4" /> Remover like
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" /> Dar like
              </>
            )}
          </Button>
          <span className="text-lg font-semibold">
            {article.likes_count ?? 0} likes
          </span>
        </div>

        {/* Conteúdo */}
        <div className="prose mb-12">
          {article.content.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>

        {/* Comentários */}
        <section className="border-t pt-10">
          <h2 className="text-2xl font-semibold mb-6">
            Comentários ({comments.length})
          </h2>

          <form onSubmit={handleSubmitComment} className="mb-8">
            <Textarea
              placeholder="Escreve um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <Button disabled={isSubmitting || !newComment.trim()}>
              Publicar
            </Button>
          </form>

          <div className="space-y-6">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={c.user.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {c.user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{c.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("pt-PT")}
                      </p>
                    </div>

                    {currentUser?.id === c.user_id && (
                      <div className="flex items-center gap-3">
                        <Pencil
                          onClick={() => startEditing(c)}
                          className="h-5 w-5 cursor-pointer"
                        />
                        <Trash2
                          onClick={() => deleteComment(c.id)}
                          className="h-5 w-5 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {editingId === c.id ? (
                    <div className="mt-3">
                      <Textarea
                        value={editingContent}
                        onChange={(e) =>
                          setEditingContent(e.target.value)
                        }
                        rows={3}
                        className="mb-3"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}>
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm">{c.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  )
}

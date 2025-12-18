"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { supabase } from "@/packages/supabase-client/src/client"

import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, HeartOff, Pencil, Trash2, MessageSquare, User } from "lucide-react"
import { incrementViewAction } from "../actions"

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
  parent_id: string | null
  replies?: Comment[]
  user: {
    name: string
    avatar_url: string | null
  }
}

interface RecommendedArticle {
  article_id: string
  title: string
  summary: string
  cover_url: string | null
  author: { name: string }
  likes_count: number
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
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasLiked, setHasLiked] = useState(false)

  // recomendações
  const [recommendations, setRecommendations] = useState<RecommendedArticle[]>([])
  const [loadingRecs, setLoadingRecs] = useState(false)

  // edição de comentários
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")

  // respostas
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")

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
         const { error } = await supabase
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
          if (error) console.error("Erro ao registar visualização:", error)
      }

      // 2. Incrementar contador via Server Action (Revalida cache)
      await incrementViewAction(articleId);
      
    }, 5000) // ⏱️ 5 segundos

    return () => clearTimeout(timeout)
  }, [articleId, currentUser])


  /*  FIX: Recarregar quando voltar do feed */
  useEffect(() => {
    const reloadOnReturn = () => {
      loadArticle()
      checkIfUserLiked()
      if (currentUser) loadRecommendations()
    }

    window.addEventListener("popstate", reloadOnReturn)
    document.addEventListener("visibilitychange", reloadOnReturn)

    return () => {
      window.removeEventListener("popstate", reloadOnReturn)
      document.removeEventListener("visibilitychange", reloadOnReturn)
    }
  }, [currentUser])

  /*  CARREGAR DADOS  */
  useEffect(() => {
    if (!articleId) return
    loadArticle()
    loadComments()

    if (currentUser) {
      checkIfUserLiked()
      loadRecommendations()
    } else {
      setHasLiked(false)
    }
  }, [articleId, currentUser])

  /* CARREGAR RECOMENDAÇÕES (CSP) */
  const loadRecommendations = async () => {
    if (!currentUser || !articleId) return
        
    setLoadingRecs(true)
    // A função 'invoke' envia automaticamente o token do utilizador atual
    const { data, error } = await supabase.functions.invoke('recommendArticles', {
      body: { article_id: articleId } // Enviamos o ID atual para excluí-lo e marcar como "lido" no contexto
    })
    if (error) {
      console.error("Erro ao carregar recomendações:", error)
    } else {
      setRecommendations(data || [])
    }
    setLoadingRecs(false)
  }

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
        parent_id,
        user:users(user_id, name, avatar_url)
      `)
      .eq("article_id", articleId)
      .order("created_at", { ascending: true }) // Ordem cronológica ajuda a estruturar

    if (!error && data) {
      const allComments: Comment[] = data.map((row: any) => {
        const user = pickOne(row.user)
        return {
          id: row.id,
          content: row.content,
          created_at: row.created_at,
          user_id: row.user_id,
          parent_id: row.parent_id,
          replies: [],
          user: {
            name: user?.name ?? "Usuário",
            avatar_url: user?.avatar_url ?? null,
          },
        }
      })

      // Construir árvore de comentários
      const commentMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      allComments.forEach(c => commentMap.set(c.id, c))

      allComments.forEach(c => {
        if (c.parent_id) {
          const parent = commentMap.get(c.parent_id)
          if (parent) {
            parent.replies = parent.replies || []
            parent.replies.push(c)
          } else {
             // Se pai não encontrado, trata como raiz (fallback)
             rootComments.push(c)
          }
        } else {
          rootComments.push(c)
        }
      })

      // Ordenar decrescente para os recentes aparecerem primeiro no topo
      rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setComments(rootComments)
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
      parent_id: null
    })

    setNewComment("")
    loadComments()
    setIsSubmitting(false)
  }

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("comments").insert({
      content: replyContent,
      article_id: articleId,
      user_id: user.id,
      parent_id: parentId
    })

    setReplyContent("")
    setReplyingTo(null)
    loadComments()
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

  const renderComment = (comment: Comment) => (
    <div key={comment.id} className="mb-6">
      <div className="flex gap-4">
        <Avatar>
          <AvatarImage src={comment.user.avatar_url || undefined} />
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{comment.user.name}</span>
              <span className="text-sm text-muted-foreground">
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
            </div>
            {currentUser?.id === comment.user_id && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => startEditing(comment)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteComment(comment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {editingId === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit()}>
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground">{comment.content}</p>
              {currentUser && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  <MessageSquare className="w-3 h-3 mr-1.5" /> Responder
                </Button>
              )}
            </>
          )}

          {replyingTo === comment.id && (
            <div className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                <AvatarFallback>
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Escreva a sua resposta..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent("")
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleReplySubmit(comment.id)}
                    disabled={!replyContent.trim()}
                  >
                    Responder
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 pl-4 border-l-2 mt-4 space-y-4">
          {comment.replies.map(renderComment)}
        </div>
      )}
    </div>
  )

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

        {/* --- SECÇÃO DE RECOMENDAÇÕES (IA / CSP) --- */}
        {currentUser && (
          <section className="my-12 border-t pt-8">
            <h3 className="text-2xl font-bold mb-6">Recomendado para si</h3>
            
            {loadingRecs ? (
              <p className="text-muted-foreground">A personalizar sugestões...</p>
            ) : recommendations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec) => (
                  <Link 
                     href={`/article/${rec.article_id}`} 
                     key={rec.article_id}
                    className="group block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {rec.cover_url ? (
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={rec.cover_url} 
                          alt={rec.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                        Sem imagem
                      </div>
                    )}
                    
                    <div className="p-4">
                      <h4 className="font-semibold text-lg leading-tight mb-2 group-hover:text-primary">
                        {rec.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {rec.summary}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{rec.author?.name || "Autor"}</span>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {rec.likes_count}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Não encontrámos recomendações novas neste momento.
              </p>
            )}
          </section>
        )}

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
            {comments.map(renderComment)}
          </div>
        </section>
      </article>
    </div>
  )
}
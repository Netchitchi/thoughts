"use client"

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { CommunityPost, PostType } from "@/packages/types/community";
import { 
  MessageSquare, 
  FileText, 
  Link as LinkIcon, 
  HelpCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Bookmark, 
  ArrowRight,
  Send,
  Trash2,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/packages/supabase-client/src/client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";

interface CommunityPostItemProps {
  post: CommunityPost;
  currentUserId?: string;
}

const TypeIcon = ({ type }: { type: PostType }) => {
  switch (type) {
    case 'feedback': return <FileText className="w-4 h-4" />;
    case 'article_share': return <LinkIcon className="w-4 h-4" />;
    case 'question': return <HelpCircle className="w-4 h-4" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
};

const TypeLabel = ({ type }: { type: PostType }) => {
  switch (type) {
    case 'feedback': return "Pedido de Feedback";
    case 'article_share': return "Artigo Partilhado";
    case 'question': return "Pergunta";
    default: return "Discussão";
  }
};

const TypeBadge = ({ type }: { type: PostType }) => {
  const colors = {
    discussion: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200",
    feedback: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
    article_share: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
    question: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200",
  };

  return (
    <Badge variant="outline" className={`gap-1 ${colors[type] || colors.discussion}`}>
      <TypeIcon type={type} />
      <span>{TypeLabel({ type })}</span>
    </Badge>
  );
};

export function CommunityPostItem({ post, currentUserId }: CommunityPostItemProps) {
  
  // State for likes
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(post.user_has_liked || false);
  const [isLiking, setIsLiking] = useState(false);

  // State for comments
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = async () => {
    if (!currentUserId) {
      alert("Precisas de fazer login para interagir.");
      return;
    }

    if (isLiking) return;

    // Optimistic update
    const previousHasLiked = hasLiked;
    const previousLikesCount = likesCount;

    setHasLiked(!hasLiked);
    setLikesCount(hasLiked ? likesCount - 1 : likesCount + 1);
    setIsLiking(true);

    try {
      if (hasLiked) {
        // Unlike
        const { error } = await supabase
          .from("community_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("community_likes")
          .insert({
            post_id: post.id,
            user_id: currentUserId
          });

        if (error) throw error;
      }
    } catch (error) {
      // Revert on error
      setHasLiked(previousHasLiked);
      setLikesCount(previousLikesCount);
      console.error("Error liking post:", error);
      alert("Não foi possível atualizar o like.");
    } finally {
      setIsLiking(false);
    }
  };

  const toggleComments = async () => {
    const newShowComments = !showComments;
    setShowComments(newShowComments);

    if (newShowComments && comments.length === 0) {
      await loadComments();
    }
  };

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      // Fetch comments without join first to avoid permissions issues
      const { data: commentsData, error } = await supabase
        .from("community_comments")
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch authors details manually
      const userIds = Array.from(new Set(commentsData.map((c: any) => c.user_id)));
      let authorsMap: Record<string, { name: string; avatar_url: string }> = {};

      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("user_id, name, avatar_url")
          .in("user_id", userIds);
          
        users?.forEach((u: any) => {
          authorsMap[u.user_id] = { name: u.name, avatar_url: u.avatar_url };
        });
      }

      // Transform data
      const formattedComments = commentsData.map((comment: any) => ({
        ...comment,
        author_name: authorsMap[comment.user_id]?.name || "Utilizador",
        author_avatar: authorsMap[comment.user_id]?.avatar_url || null
      }));

      setComments(formattedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setIsSubmittingComment(true);

    try {
      const { data, error } = await supabase
        .from("community_comments")
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Get user data for optimistic update or fetch again
      const { data: userData } = await supabase.auth.getUser();
      
      const newCommentObj = {
        ...data,
        author_name: userData.user?.user_metadata?.name || "Eu",
        author_avatar: userData.user?.user_metadata?.avatar_url || null
      };

      setComments([...comments, newCommentObj]);
      setNewComment("");
      setCommentsCount(commentsCount + 1);
      
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Não foi possível enviar o comentário.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Tens a certeza que queres apagar este comentário?")) return;

    try {
      const { error } = await supabase
        .from("community_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", currentUserId);

      if (error) throw error;

      setComments(comments.filter(c => c.id !== commentId));
      setCommentsCount(commentsCount - 1);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Não foi possível apagar o comentário.");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 bg-accent rounded-full overflow-hidden">
              <img
                src={post.author?.avatar_url || "/placeholder.svg"}
                alt={post.author?.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-foreground">{post.author?.name || "Usuário Desconhecido"}</p>
                {post.group && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <Link href={`/community/groups/${post.group_id}`} className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                      {post.group.name}
                    </Link>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(post.created_at).toLocaleDateString('pt-PT')} às {new Date(post.created_at).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {post.type && <TypeBadge type={post.type} />}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{post.content}</p>
          
          {post.image_url && (
            <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-accent mt-3">
              <Image src={post.image_url} alt="post" fill className="object-cover" />
            </div>
          )}
        </div>

        {/* Linked Article */}
        {post.article && (
          <div className="mt-2 border rounded-xl overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors group">
            <Link href={`/article/${post.article.article_id}`} className="flex flex-col sm:flex-row gap-0 sm:gap-4">
               {post.article.cover_url && (
                 <div className="sm:w-32 h-32 sm:h-auto relative shrink-0">
                   <img 
                     src={post.article.cover_url} 
                     alt={post.article.title} 
                     className="w-full h-full object-cover"
                   />
                 </div>
               )}
               <div className="p-4 flex-1 flex flex-col justify-center">
                 <h4 className="font-bold text-base group-hover:text-primary transition-colors line-clamp-1">{post.article.title}</h4>
                 <p className="text-sm text-muted-foreground line-clamp-2 mt-1 mb-3">{post.article.summary}</p>
                 <div className="flex items-center text-xs font-medium text-primary">
                   Ler artigo <ArrowRight className="w-3 h-3 ml-1" />
                 </div>
               </div>
            </Link>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4 pt-4 border-t mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-2 sm:px-3 gap-1.5 rounded-full ${hasLiked ? 'text-green-600 bg-green-50' : 'text-muted-foreground hover:text-green-600 hover:bg-green-50'}`}
            onClick={handleLike}
          >
            <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} /> 
            <span className="hidden sm:inline">Útil ({likesCount})</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-muted-foreground hover:text-red-600 gap-1.5 rounded-full hover:bg-red-50">
            <ThumbsDown className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 sm:px-3 text-muted-foreground hover:text-blue-600 gap-1.5 rounded-full hover:bg-blue-50"
            onClick={toggleComments}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Comentar ({commentsCount})</span>
          </Button>
          
          <div className="ml-auto">
            {post.article && (
              <Button variant="ghost" size="sm" className="h-8 px-2 sm:px-3 text-muted-foreground hover:text-primary gap-1.5 rounded-full">
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Guardar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-4 border-t mt-2 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-4 mb-4">
              {isLoadingComments ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-2">Seja o primeiro a comentar!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author_avatar || undefined} />
                      <AvatarFallback>{comment.author_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-muted/50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm font-semibold">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                      {currentUserId === comment.user_id && (
                        <button 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-500 hover:text-red-700 mt-2 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Apagar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            {currentUserId ? (
              <form onSubmit={handleSubmitComment} className="flex gap-3 items-start">
                <Avatar className="w-8 h-8">
                  {/* We assume current user avatar is available or handled by context/auth - simplified here */}
                  <AvatarFallback>EU</AvatarFallback>
                </Avatar>
                <div className="flex-1 gap-2 flex flex-col">
                  <Textarea 
                    placeholder="Escreva um comentário..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none text-sm"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isSubmittingComment || !newComment.trim()}>
                      {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      Comentar
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Faça login para comentar.</p>
              </div>
            )}
          </div>
        )}

      </CardContent>
    </Card>
  );
}

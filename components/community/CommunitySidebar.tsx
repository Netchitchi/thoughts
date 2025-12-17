"use client"

import Link from "next/link";
import Image from "next/image";
import { Button } from "../ui/button";
import { Search, Home, Compass, Folder, TrendingUp, BookOpen, PenSquare } from "lucide-react";
import { Group } from "@/packages/types/community";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/packages/supabase-client/src/client";

interface CommunitySidebarProps {
  userGroups: Group[];
}

export function CommunitySidebar({ userGroups }: CommunitySidebarProps) {
  const params = useParams();
  const groupId = params?.id as string | undefined;
  
  const [popularPosts, setPopularPosts] = useState<any[]>([]);
  const [recommendedArticles, setRecommendedArticles] = useState<any[]>([]);

  useEffect(() => {
    if (!groupId) return;

    const fetchData = async () => {
      // Fetch popular posts (mock: recent)
      const { data: posts } = await supabase
        .from("community_posts")
        .select("id, content")
        .eq("group_id", groupId)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (posts) setPopularPosts(posts);

      // Fetch recommended articles (mock: recent)
      const { data: articles } = await supabase
        .from("articles")
        .select("article_id, title")
        .order("created_at", { ascending: false })
        .limit(3);
        
      if (articles) setRecommendedArticles(articles);
    };

    fetchData();
  }, [groupId]);

  return (
    <aside className="w-72 hidden md:flex flex-col gap-6 sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto pr-2">
      <h2 className="text-2xl font-semibold shrink-0">Grupos</h2>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted shrink-0">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Pesquisar grupos"
          className="bg-transparent w-full text-sm outline-none"
        />
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        <Link href="/community" className={`flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition ${!groupId ? "bg-accent" : ""}`}>
          <Home className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Seu feed</span>
        </Link>

        <Link href="/community/discover" className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition">
          <Compass className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Descobrir</span>
        </Link>
      </nav>

      {/* Group Context */}
      {groupId && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
           
           <div className="space-y-3">
             <div className="flex items-center gap-2 text-primary font-semibold">
               <TrendingUp className="w-4 h-4" />
               <span className="text-sm">Discussões Populares</span>
             </div>
             <div className="space-y-2">
               {popularPosts.length > 0 ? (
                 popularPosts.map(post => (
                   <div key={post.id} className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition cursor-pointer">
                     <p className="text-xs line-clamp-2">{post.content}</p>
                   </div>
                 ))
               ) : (
                 <p className="text-xs text-muted-foreground">Sem discussões recentes.</p>
               )}
             </div>
           </div>

           <div className="space-y-3">
             <div className="flex items-center gap-2 text-primary font-semibold">
               <BookOpen className="w-4 h-4" />
               <span className="text-sm">Artigos Recomendados</span>
             </div>
             <div className="space-y-2">
               {recommendedArticles.length > 0 ? (
                 recommendedArticles.map(article => (
                   <Link key={article.article_id} href={`/article/${article.article_id}`} className="block p-2 rounded-lg bg-muted/50 hover:bg-muted transition">
                     <p className="text-xs font-medium line-clamp-2">{article.title}</p>
                   </Link>
                 ))
               ) : (
                 <p className="text-xs text-muted-foreground">Sem artigos recentes.</p>
               )}
             </div>
           </div>

           <Button className="w-full gap-2" size="sm" onClick={() => document.querySelector('textarea')?.focus()}>
             <PenSquare className="w-4 h-4" />
             Criar Post
           </Button>

           <div className="h-px bg-border my-4" />
        </div>
      )}

      <Link href="/community/create">
        <Button className="w-full" variant="outline">
          + Criar novo grupo
        </Button>
      </Link>

      {/* User groups */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Seus Grupos</p>
          <Link href="#" className="text-xs text-primary hover:underline">Ver tudo</Link>
        </div>

        <div className="space-y-3">
          {userGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground">Você ainda não participa de nenhum grupo.</p>
          ) : (
            userGroups.map((g) => (
              <Link key={g.id} href={`/community/groups/${g.id}`} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition ${groupId === g.id ? "bg-accent/80" : ""}`}>
                <div className="relative w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-border/50">
                   <img
                    src={g.image_url || "/placeholder.svg"}
                    alt={g.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight line-clamp-1">{g.name}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

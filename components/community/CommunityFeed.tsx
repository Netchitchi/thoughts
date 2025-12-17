"use client"

import { useState } from "react";
import { Card } from "../ui/card";
import { CommunityPost } from "@/packages/types/community";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { CommunityPostItem } from "./CommunityPostItem";

interface CommunityFeedProps {
  posts: CommunityPost[];
  currentUserId?: string;
}

export function CommunityFeed({ posts, currentUserId }: CommunityFeedProps) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredPosts = posts.filter(post => {
    if (activeTab === "all") return true;
    if (activeTab === "feedback") return post.type === "feedback";
    if (activeTab === "article_share") return post.type === "article_share";
    // Sort by likes logic could be done here if we had all data, but filtering "useful" 
    // usually means showing most liked. For now, we can just show all or filter by a threshold.
    // Since we don't have sort logic implemented in the filter yet, let's keep it simple.
    if (activeTab === "useful") return true; 
    return true;
  });

  // Sort if useful tab is selected
  const displayPosts = activeTab === "useful" 
    ? [...filteredPosts].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    : filteredPosts;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Ativo agora</TabsTrigger>
          <TabsTrigger value="feedback">Pedidos de feedback</TabsTrigger>
          <TabsTrigger value="article_share">Artigos partilhados</TabsTrigger>
          <TabsTrigger value="useful">Mais úteis</TabsTrigger>
        </TabsList>
      </Tabs>

      {displayPosts.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Nenhum post encontrado nesta categoria.</p>
        </Card>
      ) : (
        displayPosts.map((post) => (
          <CommunityPostItem 
            key={post.id} 
            post={post} 
            currentUserId={currentUserId}
          />
        ))
      )}
    </div>
  );
}

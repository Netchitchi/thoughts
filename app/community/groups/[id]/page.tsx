import { createClient } from "@/packages/supabase-client/src/server";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { CreatePostForm } from "@/components/community/CreatePostForm";
import { GroupHeader } from "@/components/community/GroupHeader";
import { redirect } from "next/navigation";
import { CommunityPost } from "@/packages/types/community";

export default async function GroupPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch group
  const { data: group, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !group) {
    return <div>Grupo não encontrado</div>;
  }

  // Check membership
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  const isMember = !!membership;
  const isOwner = group.created_by === user.id;

  // Fetch posts if member or group is public
  let posts: CommunityPost[] = [];
  if (isMember || group.is_public) {
     const { data: postsData } = await supabase
       .from("community_posts")
       .select(`
        *,
        groups (
          name,
          image_url
        ),
        article:articles (
          article_id,
          title,
          summary,
          cover_url
        ),
        likes:community_likes(count),
        comments:community_comments(count)
      `)
       .eq("group_id", group.id)
       .order("created_at", { ascending: false });
       
     // Fetch authors
     const userIds = Array.from(new Set(postsData?.map((p: any) => p.user_id) || []));
     let authorsMap: Record<string, { name: string; avatar_url: string }> = {};

     if (userIds.length > 0) {
       // @ts-ignore
       const { data: users } = await supabase
         .from("users")
         .select("user_id, name, avatar_url")
         .in("user_id", userIds);

       users?.forEach((u: any) => {
         authorsMap[u.user_id] = { name: u.name, avatar_url: u.avatar_url };
       });
     }

     // Fetch liked posts by current user
     let likedPostIds = new Set<string>();
     
     const { data: likedData } = await supabase
       .from("community_likes")
       .select("post_id")
       .eq("user_id", user.id);
    
     if (likedData) {
       likedData.forEach((l: any) => likedPostIds.add(l.post_id));
     }
     

     posts = postsData?.map((p: any) => ({
        ...p,
        author: authorsMap[p.user_id],
        group: p.groups,
        likes_count: p.likes?.[0]?.count || 0,
        comments_count: p.comments?.[0]?.count || 0,
        user_has_liked: likedPostIds.has(p.id)
     })) || [];
  }

  // Fetch recent articles for post creation
  const { data: articles } = await supabase
    .from("articles")
    .select("article_id, title")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex-1 max-w-2xl mx-auto space-y-6">
      <GroupHeader group={group} isMember={isMember} isOwner={isOwner} />
      
      {isMember || group.is_public ? (
        <>
          {isMember && <CreatePostForm groupId={group.id} articles={articles || []} />}
          <CommunityFeed posts={posts} currentUserId={user.id} />
        </>
      ) : (
        <div className="text-center p-10 bg-muted rounded-xl">
          <p className="text-muted-foreground">Entre no grupo para ver e criar posts.</p>
        </div>
      )}
    </div>
  );
}

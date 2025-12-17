import { createClient } from "../../packages/supabase-client/src/server";
import { CommunityFeed } from "../../components/community/CommunityFeed";
import { CommunityPost } from "../../packages/types/community";

export default async function CommunityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user's joined groups to filter the feed
  const { data: members } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user!.id);
    
  const myGroupIds = members?.map(m => m.group_id) || [];

  if (myGroupIds.length === 0) {
    return (
      <main className="flex-1 max-w-2xl mx-auto space-y-6">
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold mb-2">Ainda não segues nenhum grupo</h2>
          <p className="text-muted-foreground mb-6">Explora comunidades para veres posts aqui.</p>
          <a href="/community/discover" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Descobrir Grupos
          </a>
        </div>
      </main>
    );
  }

  // Fetch posts from joined groups
  const { data: postsData, error } = await supabase
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
    .in("group_id", myGroupIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    return <div>Error loading feed</div>;
  }

  // Fetch authors
  const userIds = Array.from(new Set(postsData?.map((p) => p.user_id) || []));
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

  // Fetch liked posts by current user
  let likedPostIds = new Set<string>();
  if (user) {
    const { data: likedData } = await supabase
      .from("community_likes")
      .select("post_id")
      .eq("user_id", user.id);
    
    if (likedData) {
      likedData.forEach((l: any) => likedPostIds.add(l.post_id));
    }
  }

  const posts: CommunityPost[] = postsData?.map((p: any) => ({
    ...p,
    author: authorsMap[p.user_id],
    group: p.groups,
    likes_count: p.likes?.[0]?.count || 0,
    comments_count: p.comments?.[0]?.count || 0,
    user_has_liked: likedPostIds.has(p.id)
  })) || [];

  return (
    <main className="flex-1 max-w-2xl mx-auto space-y-6">
      <CommunityFeed posts={posts} currentUserId={user?.id} />
    </main>
  );
}

import { createClient } from "@/packages/supabase-client/src/server";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { redirect } from "next/navigation";
import { Group } from "@/packages/types/community";

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user groups
  const { data: members, error } = await supabase
    .from("group_members")
    .select(`
      groups (
        id,
        name,
        description,
        image_url,
        is_public,
        created_by,
        created_at
      )
    `)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error fetching groups:", error);
  }

  // Flatten the response to get just the group objects
  // @ts-ignore
  const userGroups: Group[] = members?.map((m) => m.groups).filter(Boolean) || [];

  return (
    <div className="flex w-full max-w-6xl mx-auto px-4 py-10 gap-10">
      <CommunitySidebar userGroups={userGroups} />
      {children}
    </div>
  );
}

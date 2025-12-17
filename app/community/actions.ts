"use server"

import { createClient } from "@/packages/supabase-client/src/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function joinGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member'
    });

  if (error) {
    console.error("Error joining group:", error);
    throw new Error("Failed to join group");
  }

  revalidatePath("/community");
  revalidatePath(`/community/groups/${groupId}`);
}

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  // A imagem já foi carregada no cliente, aqui recebemos apenas a URL
  const imageUrl = formData.get("image_url") as string;

  console.log("Creating group:", { name, user: user.id, imageUrl });

  if (!name) throw new Error("Name is required");

  // Create group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      description,
      image_url: imageUrl || null,
      created_by: user.id,
      is_public: true
    })
    .select()
    .single();

  if (groupError) {
    console.error("Error creating group:", groupError);
    throw new Error("Failed to create group");
  }

  // Add creator as admin
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin'
    });

  if (memberError) {
    console.error("Error adding admin:", memberError);
    // Try to rollback group creation? For now just log.
  }

  revalidatePath("/community");
  redirect(`/community/groups/${group.id}`);
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check if user is the creator
  const { data: group } = await supabase
    .from("groups")
    .select("created_by")
    .eq("id", groupId)
    .single();

  if (!group) {
    throw new Error("Group not found");
  }

  if (group.created_by !== user.id) {
    throw new Error("Only the group owner can delete the group");
  }

  // Delete group (cascade will handle members and posts)
  const { error } = await supabase
    .from("groups")
    .delete()
    .eq("id", groupId);

  if (error) {
    console.error("Error deleting group:", error);
    throw new Error("Failed to delete group");
  }

  revalidatePath("/community");
  redirect("/community");
}

export async function createPost(groupId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const content = formData.get("content") as string;
  const type = formData.get("type") as string || 'discussion';
  let articleId = formData.get("article_id") as string || null;
  
  if (articleId === "_none_") {
    articleId = null;
  }
  // const imageUrl = formData.get("image_url") as string; 
  // TODO: Implement post image upload

  console.log("Creating post in group:", groupId, "by user:", user.id);

  if (!content) throw new Error("Content is required");

  const { error } = await supabase
    .from("community_posts")
    .insert({
      group_id: groupId,
      user_id: user.id,
      content,
      type,
      article_id: articleId
      // image_url: imageUrl
    });

  if (error) {
    console.error("Error creating post:", error);
    throw new Error(`Failed to create post: ${error.message}`);
  }

  revalidatePath(`/community/groups/${groupId}`);
  revalidatePath("/community");
}

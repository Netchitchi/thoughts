"use server"

import { createClient } from "@/packages/supabase-client/src/server";
import { revalidatePath } from "next/cache";

export async function incrementViewAction(articleId: string) {
  const supabase = await createClient();
  
  console.log(`[incrementViewAction] Tentando incrementar views para artigo: ${articleId}`);

  // 1. Tentar chamar a função RPC (mais segura e correta)
  const { error } = await supabase.rpc('increment_article_view', { 
    article_id_param: articleId 
  });

  if (error) {
    console.error("[incrementViewAction] Erro ao incrementar views via RPC:", error);
  } else {
    console.log(`[incrementViewAction] Sucesso ao incrementar view para artigo: ${articleId}`);
    // Se funcionou, revalidar as páginas para atualizar o contador visualmente
    revalidatePath(`/article/${articleId}`);
    revalidatePath("/feed");
    revalidatePath("/");
  }
}

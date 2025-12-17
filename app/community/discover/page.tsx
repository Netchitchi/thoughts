import { createClient } from "@/packages/supabase-client/src/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { joinGroup } from "../actions";

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get my group IDs
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);
    
  const myGroupIds = myMemberships?.map((m: any) => m.group_id) || [];

  // Get all public groups
  const { data: groups } = await supabase
    .from("groups")
    .select("*")
    .eq("is_public", true);

  // Filter
  const groupsToJoin = groups?.filter((g: any) => !myGroupIds.includes(g.id)) || [];

  return (
    <div className="flex-1 max-w-2xl mx-auto space-y-6">
       <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Descobrir Grupos</h1>
        <p className="text-sm text-muted-foreground">Encontre novas comunidades para participar.</p>
      </Card>

      <div className="grid gap-4">
        {groupsToJoin.map((group: any) => (
          <Card key={group.id}>
            <CardContent className="p-4 flex items-center gap-4">
               <div className="relative h-16 w-16 flex-shrink-0 bg-accent rounded-lg overflow-hidden">
                  <img 
                    src={group.image_url || "/placeholder.svg"} 
                    alt={group.name} 
                    className="w-full h-full object-cover" 
                  />
               </div>
               <div className="flex-1">
                 <h3 className="font-bold">{group.name}</h3>
                 <p className="text-sm text-muted-foreground line-clamp-2">{group.description}</p>
               </div>
               <form action={joinGroup.bind(null, group.id)}>
                 <Button type="submit">Entrar</Button>
               </form>
            </CardContent>
          </Card>
        ))}
        {groupsToJoin.length === 0 && (
          <p className="text-center text-muted-foreground">Nenhum grupo novo para descobrir no momento.</p>
        )}
      </div>
    </div>
  )
}

"use client"

import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { createPost } from "@/app/community/actions";
import { useFormStatus } from "react-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "../ui/label";
import { MessageSquare, FileText, HelpCircle, Link as LinkIcon, Loader2 } from "lucide-react";

interface Article {
  article_id: string;
  title: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          A publicar...
        </>
      ) : (
        "Publicar"
      )}
    </Button>
  );
}

export function CreatePostForm({ groupId, articles }: { groupId: string; articles: Article[] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <form action={createPost.bind(null, groupId)} className="space-y-4">
           <Textarea 
             name="content" 
             placeholder="No que você está pensando?" 
             required 
             className="resize-none min-h-[100px]"
           />
           
           <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1 space-y-2">
               <Label htmlFor="type" className="text-xs text-muted-foreground">Tipo de Post</Label>
               <Select name="type" defaultValue="discussion">
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione o tipo" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="discussion">
                     <div className="flex items-center gap-2">
                       <MessageSquare className="w-4 h-4" />
                       <span>Discussão</span>
                     </div>
                   </SelectItem>
                   <SelectItem value="feedback">
                     <div className="flex items-center gap-2">
                       <FileText className="w-4 h-4" />
                       <span>Pedido de Feedback</span>
                     </div>
                   </SelectItem>
                   <SelectItem value="article_share">
                     <div className="flex items-center gap-2">
                       <LinkIcon className="w-4 h-4" />
                       <span>Partilha de Artigo</span>
                     </div>
                   </SelectItem>
                   <SelectItem value="question">
                     <div className="flex items-center gap-2">
                       <HelpCircle className="w-4 h-4" />
                       <span>Pergunta</span>
                     </div>
                   </SelectItem>
                 </SelectContent>
               </Select>
             </div>

             <div className="flex-1 space-y-2">
               <Label htmlFor="article_id" className="text-xs text-muted-foreground">Artigo Relacionado (Opcional)</Label>
               <Select name="article_id">
                 <SelectTrigger>
                   <SelectValue placeholder="Selecionar artigo..." />
                 </SelectTrigger>
                 <SelectContent>
                    <SelectItem value="_none_">Nenhum</SelectItem>
                    {articles.map((article) => (
                      <SelectItem key={article.article_id} value={article.article_id}>
                        <span className="truncate block max-w-[200px]">{article.title}</span>
                      </SelectItem>
                    ))}
                 </SelectContent>
               </Select>
             </div>
           </div>

           <div className="flex justify-end pt-2">
             <SubmitButton />
           </div>
        </form>
      </CardContent>
    </Card>
  )
}

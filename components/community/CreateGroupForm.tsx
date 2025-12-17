"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGroup } from "@/app/community/actions";
import { Upload, Loader2, X } from "lucide-react";
import { useFormStatus } from "react-dom";
import { supabase } from "@/packages/supabase-client/src/client";
import { Card } from "@/components/ui/card";

function SubmitButton({ isUploading }: { isUploading: boolean }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" className="w-full" disabled={pending || isUploading}>
      {pending || isUploading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isUploading ? "A carregar imagem..." : "A criar grupo..."}
        </>
      ) : (
        "Criar Grupo"
      )}
    </Button>
  );
}

export function CreateGroupForm() {
  const [preview, setPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    // Preview local imediato
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuário não autenticado.");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("group-covers")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("group-covers")
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      console.log("Imagem carregada com sucesso:", publicUrl);

    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      // Limpar preview se falhar
      setPreview(null);
      alert("Erro ao enviar a imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    setImageUrl(null);
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <form action={createGroup} className="space-y-6">
      <input type="hidden" name="image_url" value={imageUrl || ""} />

      <div className="space-y-2">
        <Label htmlFor="name">Nome do Grupo</Label>
        <Input id="name" name="name" placeholder="Ex: Desenvolvedores Next.js" required />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" placeholder="Sobre o que é este grupo?" />
      </div>

      <div className="space-y-2">
        <Label>Imagem de Capa</Label>
        
        {!preview ? (
          <div className="mt-3 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => document.getElementById("image")?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> Escolher ficheiro
                </>
              )}
            </Button>
            <Input 
              id="image" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </div>
        ) : (
          <Card className="overflow-hidden mt-4 relative">
            <div className="h-64 w-full bg-muted flex items-center justify-center relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover object-center"
              />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
               <div className="absolute bottom-4 left-4 text-white pointer-events-none">
                  <p className="text-sm font-medium opacity-80">Pré-visualização da capa</p>
               </div>
            </div>
             <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </Card>
        )}
      </div>

      <SubmitButton isUploading={isUploading} />
    </form>
  );
}

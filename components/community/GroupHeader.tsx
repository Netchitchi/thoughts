"use client"

import Image from "next/image";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Group } from "@/packages/types/community";
import { joinGroup, deleteGroup } from "@/app/community/actions";
import { Trash2 } from "lucide-react";

export function GroupHeader({ group, isMember, isOwner }: { group: Group, isMember: boolean, isOwner?: boolean }) {
  const handleDelete = async () => {
    if (confirm("Tem a certeza que deseja apagar este grupo? Esta ação não pode ser desfeita.")) {
       await deleteGroup(group.id);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative h-64 w-full bg-muted group">
        {/* Usando img normal temporariamente para evitar problemas de domínio/cache do next/image durante dev */}
        <img 
          src={group.image_url || "/placeholder.svg"} 
          alt={group.name} 
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 p-6 text-white w-full">
            <h1 className="text-3xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="text-white/90 mt-2 max-w-2xl line-clamp-2">{group.description}</p>
            )}
        </div>
      </div>
      <div className="p-4 flex justify-between items-center bg-background">
          <div>
            {isOwner && (
               <form action={deleteGroup.bind(null, group.id)} onSubmit={(e) => {
                 if (!confirm("Tem a certeza que deseja apagar este grupo? Esta ação é irreversível e apagará todos os posts.")) {
                   e.preventDefault();
                 }
               }}>
                 <Button type="submit" variant="destructive" size="sm" className="gap-2">
                   <Trash2 className="w-4 h-4" />
                   Apagar Grupo
                 </Button>
               </form>
            )}
          </div>
          <div className="flex gap-2">
            {!isMember && (
               <form action={joinGroup.bind(null, group.id)}>
                 <Button type="submit" size="lg">Entrar no Grupo</Button>
               </form>
            )}
            {isMember && (
              <Button variant="outline" disabled>Membro</Button>
            )}
          </div>
      </div>
    </Card>
  )
}

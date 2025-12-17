"use client"

import { supabase } from "@/packages/supabase-client"
import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, X, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"

// Tipos
interface UserProfile {
  user_id: string
  name: string
  bio: string | null
  avatar_url: string | null
}

interface Category {
  id: string
  name: string
}

interface UserInterest {
  category_id: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadProfileAndInterests()
    loadCategories()
  }, [])

  // 🔸 Carrega perfil e interesses
  const loadProfileAndInterests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      // Perfil
      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("user_id, name, bio, avatar_url")
        .eq("user_id", user.id)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)
      setName(profileData.name)
      setBio(profileData.bio || "")
      setAvatarUrl(profileData.avatar_url || "")

      // Interesses
      const { data: interestsData, error: interestsError } = await supabase
        .from("user_interests")
        .select("category_id")
        .eq("user_id", user.id)

      if (interestsError) throw interestsError
      if (interestsData)
        setSelectedInterests(new Set(interestsData.map((i: UserInterest) => i.category_id)))
    } catch (err) {
      console.error("Erro ao carregar perfil:", err)
      setError("Erro ao carregar perfil. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // 🔸 Carrega categorias
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("id, name").order("name")
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error("Erro ao carregar categorias:", err)
    }
  }

  // 🔸 Alterna interesse
  const toggleInterest = (categoryId: string) => {
    const newSelected = new Set(selectedInterests)
    newSelected.has(categoryId)
      ? newSelected.delete(categoryId)
      : newSelected.add(categoryId)
    setSelectedInterests(newSelected)
  }

  // 🔸 Salvar perfil e interesses
  const handleSave = async () => {
    if (!name.trim()) {
      setError("O nome é obrigatório.")
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Usuário não autenticado")

      // Atualiza perfil
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: name.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        })
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Erro ao atualizar perfil:", updateError)
        throw new Error("Erro ao atualizar dados do perfil.")
      }

      // Apaga os interesses anteriores
      const { error: deleteError } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_id", user.id)

      if (deleteError) {
        console.error("Erro ao limpar interesses:", deleteError)
        throw new Error("Erro ao atualizar interesses (limpeza).")
      }

      // Insere os novos
      if (selectedInterests.size > 0) {
        const interestsToInsert = Array.from(selectedInterests)
          .filter(Boolean)
          .map((categoryId) => ({
            user_id: user.id,
            category_id: categoryId,
          }))

        console.log("Interesses a inserir:", interestsToInsert)

        const { error: insertError } = await supabase
          .from("user_interests")
          .insert(interestsToInsert)

        if (insertError && Object.keys(insertError).length > 0) {
          console.error("Erro ao salvar interesses:", insertError)
          throw new Error("Erro ao salvar novos interesses.")
        } else {
          console.log("Interesses salvos com sucesso!")
        }
      }

      setSuccess("Perfil atualizado com sucesso!")
      setTimeout(() => router.push("/profile"), 1500)
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err)
      setError(err.message || "Não foi possível salvar as alterações. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    const file = e.target.files[0]
    
    // Validar tamanho (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 50MB.")
      return
    }

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      setError("O ficheiro deve ser uma imagem.")
      return
    }

    await uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    try {
      if (!profile?.user_id) return
      
      setIsUploading(true)
      setError(null)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`
      
      // Upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      setAvatarUrl(data.publicUrl)
      
    } catch (err: any) {
       console.error('Erro ao fazer upload da imagem:', err)
       setError(err.message || 'Erro ao fazer upload da imagem.')
    } finally {
      setIsUploading(false)
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 🔸 Estado de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthenticatedNavbar />
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">Gerencie suas informações e preferências</p>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-lg bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400 flex items-start gap-2">
            <span className="flex-1">{success}</span>
            <button onClick={() => setSuccess(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Formulário */}
        <div className="space-y-8">
          {/* Perfil */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Informações do perfil</h2>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="text-xl">
                    {name ? getInitials(name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="avatarUrl">Foto de Perfil</Label>
                  <div className="flex gap-4 mt-2 items-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={isUploading || isSaving}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isSaving}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          A carregar...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Carregar foto
                        </>
                      )}
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setAvatarUrl("")}
                        disabled={isUploading || isSaving}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recomendado: Quadrado, max 50MB.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  className="mt-2"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre você..."
                  value={bio}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setBio(e.target.value)
                  }
                  className="mt-2 min-h-[100px]"
                  disabled={isSaving}
                />
                <p className="text-sm text-muted-foreground mt-2">
                  {bio.length} caracteres
                </p>
              </div>
            </div>
          </Card>

          {/* Interesses */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-2">Interesses</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Selecione os temas que mais lhe interessam para personalizar o seu feed.
            </p>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const isSelected = selectedInterests.has(category.id)
                return (
                  <Badge
                    key={category.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
                    onClick={() => !isSaving && toggleInterest(category.id)}
                  >
                    {category.name}
                  </Badge>
                )
              })}
            </div>
          </Card>

          {/* Botões */}
          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={isSaving} className="min-w-[120px]">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar alterações"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/profile")}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

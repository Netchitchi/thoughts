"use client"

import { supabase } from "@/packages/supabase-client/src/client"
import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Settings, Heart, Bookmark } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Profile {
  user_id: string
  name: string
  bio: string | null
  avatar_url: string | null
}

interface Post {
  article_id: string
  title: string
  summary: string
  created_at: string
  categories: { name: string }[]
  views_count: number
  likes_count: number
}


export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myPosts, setMyPosts] = useState<Post[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profileData, error } = await supabase
        .from("users")
        .select("user_id, name, bio, avatar_url")
        .eq("user_id", user.id)
        .single()

      if (error) {
        console.error("Erro ao buscar perfil:", error)
      }

      if (profileData) {
        setProfile(profileData)
        loadMyPosts(user.id)
        loadBookmarkedPosts(user.id)
      }
    } catch (error) {
      console.error(" Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMyPosts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select(`
        article_id,
        title,
        summary,
        created_at,
        categories(name),
        views_count,
        likes_count
      `)
      .eq("author_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error(" Error loading my posts:", error)
      return
    }

    if (data && Array.isArray(data)) {
      setMyPosts(data as Post[])
    } else {
      setMyPosts([])
    }
  } catch (error) {
    console.error(" Error loading my posts:", error)
  }
}


  const loadBookmarkedPosts = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("bookmarks")
        .select(`
          article:articles(
            article_id,
            title,
            summary,
            created_at,
            categories(name),
            views_count,
            likes_count
          )
        `)
        .eq("user_id", userId)

      if (data) {
        setBookmarkedPosts(
          data.map((item: any) => item.article).filter(Boolean)
        )
      }
    } catch (error) {
      console.error(" Error loading bookmarked posts:", error)
    }
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthenticatedNavbar />
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <AuthenticatedNavbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Perfil não encontrado</p>
        </div>
      </div>
    )
  }

  const PostCard = ({ post }: { post: Post }) => (
  <Link href={`/post/${post.article_id}`}>
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
      <div className="p-5">
        {post.categories && post.categories.length > 0 && (
          <Badge variant="secondary" className="mb-3">
            {post.categories[0].name}
          </Badge>
        )}
        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {post.summary}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{post.likes_count || 0}</span>
          </div>
          <span>{formatDate(post.created_at)}</span>
        </div>
      </div>
    </Card>
  </Link>
)


  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
              {profile.bio && (
                <p className="text-muted-foreground">{profile.bio}</p>
              )}
            </div>
            <Link href="/settings">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Settings className="h-4 w-4" />
                Editar perfil
              </Button>
            </Link>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold">{myPosts.length}</span>{" "}
              <span className="text-muted-foreground">Posts</span>
            </div>
            <div>
              <span className="font-semibold">{bookmarkedPosts.length}</span>{" "}
              <span className="text-muted-foreground">Guardados</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts">Meus Posts</TabsTrigger>
            <TabsTrigger value="bookmarks">Guardados</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {myPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Ainda não publicou nenhum post
                </p>
                <Link href="/write">
                  <Button>Escrever primeiro post</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPosts.map((post) => (
                  <PostCard key={post.article_id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-6">
            {bookmarkedPosts.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum post guardado ainda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarkedPosts.map((post) => (
                  <PostCard key={post.article_id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

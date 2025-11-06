"use client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Bookmark, MessageCircle } from "lucide-react"
import { AuthenticatedNavbar } from "@/components/meusComponetes/authenticatednavbar"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/packages/supabase-client"

interface Category {
  id: string
  name: string
  slug: string
}

interface Post {
  id: string
  title: string
  excerpt: string
  cover_image: string | null
  created_at: string
  views: number
  author: {
    display_name: string
    avatar_url: string | null
  }
  category: {
    name: string
    slug: string
  } | null
  likes_count: number
  comments_count: number
}

export default function FeedPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedCategory])

  const loadData = async () => {
    try {
      const { data: categoriesData } = await supabase.from("categories").select("*").order("name")
      setCategories(categoriesData || [])

      let query = supabase
        .from("posts")
        .select(
          `
          id,
          title,
          excerpt,
          cover_image,
          created_at,
          views,
          author:profiles!posts_author_id_fkey(display_name, avatar_url),
          category:categories(name, slug),
          likes:likes(count),
          comments:comments(count)
        `
        )
        .eq("published", true)
        .order("created_at", { ascending: false })

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory)
      }

      const { data: postsData } = await query

      const formattedPosts =
        postsData?.map((post: any) => ({
          ...post,
          author: Array.isArray(post.author) ? post.author[0] : post.author,
          likes_count: post.likes?.[0]?.count || 0,
          comments_count: post.comments?.[0]?.count || 0,
        })) || []

      setPosts(formattedPosts)
    } catch (error) {
      console.error("[Error loading feed]:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Hoje"
    if (diffInDays === 1) return "Ontem"
    if (diffInDays < 7) return `Há ${diffInDays} dias`
    return date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedNavbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando posts...</p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum post encontrado nesta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  {post.cover_image && (
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={post.cover_image || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category && (
                      <Badge variant="secondary" className="mb-3">
                        {post.category.name}
                      </Badge>
                    )}
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{post.author.display_name}</span>
                        <span>·</span>
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bookmark className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

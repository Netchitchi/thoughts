import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // 🔹 Cria o cliente Supabase com suporte a cookies SSR
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ✅ Corrigido
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // ⚠️ Obrigatório — mantém a sessão sincronizada
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 🔹 Define rotas públicas (não exigem login)
  const publicRoutes = ["/", "/auth", "/auth/login", "/error", "/auth/cadastro", "/auth/check-email"]

  const isPublic = publicRoutes.some((path) => request.nextUrl.pathname.startsWith(path))

  // 🔒 Redireciona usuários não autenticados
  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // 🔹 Retorna o response sincronizado
  return supabaseResponse
}

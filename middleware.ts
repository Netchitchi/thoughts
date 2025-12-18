import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './packages/supabase-client/src/middleware'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Configuração de Content Security Policy (CSP)
  // Permite scripts/estilos necessários e imagens dos domínios configurados
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://images.unsplash.com https://i.pravatar.cc https://teyuifdsxgafamxcgakq.supabase.co http://127.0.0.1:54321;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://teyuifdsxgafamxcgakq.supabase.co wss://teyuifdsxgafamxcgakq.supabase.co http://127.0.0.1:54321 ws://127.0.0.1:54321;
  `

  // Remove quebras de linha e espaços extras para o header
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()

  response.headers.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
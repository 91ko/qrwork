import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // CORS 헤더 설정
  const response = NextResponse.next()
  
  const origin = request.headers.get('origin')
  
  // 모든 환경에서 모든 origin 허용 (임시)
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  // OPTIONS 요청에 대한 응답
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers })
  }
  
  return response
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}

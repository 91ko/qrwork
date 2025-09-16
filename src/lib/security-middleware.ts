import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, sanitizeLogData } from './security'

// CORS 헤더 설정
export function setCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*')
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

// 보안 헤더 설정
export function setSecurityHeaders(response: NextResponse): NextResponse {
  // XSS 방지
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // HSTS (HTTPS 강제)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // CSP (Content Security Policy)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  )
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )
  
  return response
}

// 레이트 리미팅 미들웨어
export function rateLimitMiddleware(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('x-client-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const identifier = `${ip}-${userAgent}`
  
  if (!checkRateLimit(identifier, maxRequests, windowMs)) {
    console.warn(`Rate limit exceeded for ${ip}`, {
      ip,
      userAgent,
      url: request.url,
      method: request.method
    })
    
    return new NextResponse(
      JSON.stringify({ 
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      }),
      { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(windowMs / 1000).toString()
        }
      }
    )
  }
  
  return null
}

// 요청 로깅 미들웨어
export function requestLoggingMiddleware(request: NextRequest): void {
  const startTime = Date.now()
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.headers.get('x-client-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // 민감한 정보 제외하고 로깅
  const logData = {
    timestamp: new Date().toISOString(),
    ip,
    method: request.method,
    url: request.url,
    userAgent,
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type')
  }
  
  console.log('Request:', sanitizeLogData(logData))
  
  // 응답 시간 측정을 위한 헤더 추가
  request.headers.set('x-request-start', startTime.toString())
}

// 입력 검증 미들웨어
export function inputValidationMiddleware(request: NextRequest): NextResponse | null {
  const contentType = request.headers.get('content-type')
  
  if (contentType?.includes('application/json')) {
    try {
      // JSON 크기 제한 (1MB)
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 1024 * 1024) {
        return new NextResponse(
          JSON.stringify({ message: 'Request payload too large' }),
          { status: 413, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } catch (error) {
      console.error('Input validation error:', error)
      return new NextResponse(
        JSON.stringify({ message: 'Invalid request format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
  
  return null
}

// CORS 설정
export function corsMiddleware(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://your-domain.vercel.app', // 실제 도메인으로 변경
    process.env.NEXT_PUBLIC_BASE_URL
  ].filter(Boolean)
  
  // 개발 환경에서는 모든 origin 허용
  if (process.env.NODE_ENV === 'development') {
    console.log('개발 환경: CORS 검사 건너뜀', { origin, url: request.url })
    return null
  }
  
  // origin이 없거나 허용된 origin이면 통과
  if (!origin || allowedOrigins.includes(origin)) {
    return null
  }
  
  console.warn(`CORS violation: ${origin}`, {
    origin,
    url: request.url,
    method: request.method,
    allowedOrigins
  })
  
  return new NextResponse(
    JSON.stringify({ message: 'CORS policy violation' }),
    { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// 보안 미들웨어 통합
export function securityMiddleware(request: NextRequest): NextResponse | null {
  // 요청 로깅
  requestLoggingMiddleware(request)
  
  // CORS 검사 (임시 비활성화)
  // const corsResponse = corsMiddleware(request)
  // if (corsResponse) return corsResponse
  
  // 레이트 리미팅
  const rateLimitResponse = rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse
  
  // 입력 검증
  const validationResponse = inputValidationMiddleware(request)
  if (validationResponse) return validationResponse
  
  return null
}

// 에러 핸들링 미들웨어
export function errorHandlingMiddleware(
  error: Error,
  request: NextRequest
): NextResponse {
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  })
  
  // 프로덕션에서는 상세한 에러 정보를 숨김
  const isProduction = process.env.NODE_ENV === 'production'
  
  return new NextResponse(
    JSON.stringify({
      message: isProduction ? 'Internal server error' : error.message,
      ...(isProduction ? {} : { stack: error.stack })
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

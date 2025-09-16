import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPrismaClient } from './db-security'
import { logger } from './logger'
import { config } from './env-validation'

const JWT_SECRET = config.security.jwtSecret

// 세션 정보 인터페이스
interface SessionInfo {
  sessionId: string
  userId: string
  userType: 'admin' | 'employee' | 'superAdmin'
  companyId?: string
  ip: string
  userAgent: string
  createdAt: Date
  lastActivity: Date
  isActive: boolean
}

// 활성 세션 저장소 (실제로는 Redis 사용 권장)
const activeSessions = new Map<string, SessionInfo>()

// 세션 생성
export function createSession(
  userId: string,
  userType: 'admin' | 'employee' | 'superAdmin',
  request: NextRequest,
  companyId?: string
): string {
  const sessionId = generateSessionId()
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  const sessionInfo: SessionInfo = {
    sessionId,
    userId,
    userType,
    companyId,
    ip,
    userAgent,
    createdAt: new Date(),
    lastActivity: new Date(),
    isActive: true
  }
  
  // 세션 저장
  activeSessions.set(sessionId, sessionInfo)
  
  // JWT 토큰에 세션 ID 포함
  const token = jwt.sign(
    {
      sessionId,
      userId,
      userType,
      companyId,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
  
  logger.auth('세션 생성', {
    sessionId,
    userId,
    userType,
    companyId,
    ip
  })
  
  return token
}

// 세션 검증
export function validateSession(request: NextRequest): {
  isValid: boolean
  sessionInfo?: SessionInfo
  error?: string
} {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return { isValid: false, error: '토큰이 없습니다.' }
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const sessionId = decoded.sessionId
    
    const sessionInfo = activeSessions.get(sessionId)
    if (!sessionInfo) {
      return { isValid: false, error: '세션이 존재하지 않습니다.' }
    }
    
    if (!sessionInfo.isActive) {
      return { isValid: false, error: '비활성화된 세션입니다.' }
    }
    
    // 세션 타임아웃 확인 (24시간)
    const now = new Date()
    const sessionAge = now.getTime() - sessionInfo.lastActivity.getTime()
    const maxAge = 24 * 60 * 60 * 1000 // 24시간
    
    if (sessionAge > maxAge) {
      activeSessions.delete(sessionId)
      return { isValid: false, error: '세션이 만료되었습니다.' }
    }
    
    // IP 변경 감지
    const currentIP = getClientIP(request)
    if (sessionInfo.ip !== currentIP) {
      logger.security('IP 변경 감지', {
        sessionId,
        oldIP: sessionInfo.ip,
        newIP: currentIP,
        userId: sessionInfo.userId
      })
      
      // IP 변경 시 세션 무효화 (선택적)
      // activeSessions.delete(sessionId)
      // return { isValid: false, error: 'IP가 변경되었습니다.' }
    }
    
    // 마지막 활동 시간 업데이트
    sessionInfo.lastActivity = now
    activeSessions.set(sessionId, sessionInfo)
    
    return { isValid: true, sessionInfo }
    
  } catch (error) {
    logger.error('세션 검증 실패', { error: error instanceof Error ? error.message : 'Unknown error' })
    return { isValid: false, error: '세션 검증에 실패했습니다.' }
  }
}

// 세션 무효화
export function invalidateSession(sessionId: string): boolean {
  const sessionInfo = activeSessions.get(sessionId)
  if (sessionInfo) {
    sessionInfo.isActive = false
    activeSessions.delete(sessionId)
    
    logger.auth('세션 무효화', {
      sessionId,
      userId: sessionInfo.userId,
      userType: sessionInfo.userType
    })
    
    return true
  }
  return false
}

// 사용자의 모든 세션 무효화
export function invalidateAllUserSessions(userId: string, userType: string): number {
  let invalidatedCount = 0
  
  for (const [sessionId, sessionInfo] of Array.from(activeSessions.entries())) {
    if (sessionInfo.userId === userId && sessionInfo.userType === userType) {
      sessionInfo.isActive = false
      activeSessions.delete(sessionId)
      invalidatedCount++
    }
  }
  
  logger.auth('사용자 모든 세션 무효화', {
    userId,
    userType,
    invalidatedCount
  })
  
  return invalidatedCount
}

// 동시 세션 제한
export function checkConcurrentSessions(
  userId: string,
  userType: string,
  maxSessions: number = 3
): boolean {
  let activeCount = 0
  
  for (const sessionInfo of Array.from(activeSessions.values())) {
    if (sessionInfo.userId === userId && 
        sessionInfo.userType === userType && 
        sessionInfo.isActive) {
      activeCount++
    }
  }
  
  return activeCount < maxSessions
}

// 오래된 세션 정리
export function cleanupExpiredSessions(): number {
  const now = new Date()
  const maxAge = 24 * 60 * 60 * 1000 // 24시간
  let cleanedCount = 0
  
  for (const [sessionId, sessionInfo] of Array.from(activeSessions.entries())) {
    const sessionAge = now.getTime() - sessionInfo.lastActivity.getTime()
    
    if (sessionAge > maxAge) {
      activeSessions.delete(sessionId)
      cleanedCount++
    }
  }
  
  if (cleanedCount > 0) {
    logger.info('만료된 세션 정리', { cleanedCount })
  }
  
  return cleanedCount
}

// 세션 정보 조회
export function getSessionInfo(sessionId: string): SessionInfo | null {
  return activeSessions.get(sessionId) || null
}

// 활성 세션 수 조회
export function getActiveSessionCount(): number {
  return activeSessions.size
}

// 유틸리티 함수들
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) +
         Date.now().toString(36)
}

function getTokenFromRequest(request: NextRequest): string | null {
  // 쿠키에서 토큰 추출
  const tokenCookie = request.cookies.get('token')?.value ||
                     request.cookies.get('employee-token')?.value ||
                     request.cookies.get('superAdminToken')?.value
  
  if (tokenCookie) return tokenCookie
  
  // Authorization 헤더에서 토큰 추출
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  return null
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         request.headers.get('x-client-ip') ||
         'unknown'
}

// 정기적인 세션 정리 (5분마다)
setInterval(cleanupExpiredSessions, 5 * 60 * 1000)

// 보안 이벤트 모니터링
export function monitorSecurityEvents(): void {
  setInterval(() => {
    const sessionCount = getActiveSessionCount()
    
    // 비정상적으로 많은 세션 감지
    if (sessionCount > 1000) {
      logger.security('비정상적인 세션 수 감지', { sessionCount })
    }
    
    // 의심스러운 활동 패턴 분석
    const now = new Date()
    const recentSessions = Array.from(activeSessions.values())
      .filter(session => {
        const timeDiff = now.getTime() - session.createdAt.getTime()
        return timeDiff < 60 * 1000 // 1분 이내
      })
    
    if (recentSessions.length > 50) {
      logger.security('의심스러운 로그인 패턴 감지', { 
        recentSessions: recentSessions.length 
      })
    }
  }, 60 * 1000) // 1분마다 체크
}

// 보안 모니터링 시작
monitorSecurityEvents()

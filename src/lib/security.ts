import DOMPurify from 'isomorphic-dompurify'

// XSS 방지를 위한 HTML 정화
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  return DOMPurify.sanitize(input)
}

// 입력 검증 및 정화
export function sanitizeInput(input: any): string {
  if (typeof input !== 'string') return ''
  
  // HTML 태그 제거
  const sanitized = input
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/javascript:/gi, '') // javascript: 프로토콜 제거
    .replace(/on\w+\s*=/gi, '') // 이벤트 핸들러 제거
    .trim()
  
  return sanitized
}

// 이메일 검증
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// 비밀번호 강도 검증
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.')
  }
  
  if (password.length > 128) {
    errors.push('비밀번호는 최대 128자까지 가능합니다.')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 포함해야 합니다.')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 포함해야 합니다.')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 포함해야 합니다.')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자를 포함해야 합니다.')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// SQL 인젝션 방지를 위한 문자열 이스케이프
export function escapeSqlString(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z')
}

// 파일 업로드 검증
export function validateFileUpload(file: File): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
  
  if (file.size > maxSize) {
    errors.push('파일 크기는 5MB를 초과할 수 없습니다.')
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('허용되지 않는 파일 형식입니다.')
  }
  
  // 파일명 검증
  const fileName = sanitizeInput(file.name)
  if (fileName !== file.name) {
    errors.push('파일명에 특수문자가 포함되어 있습니다.')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// CSRF 토큰 생성
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// IP 주소 검증
export function validateIPAddress(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// 요청 제한을 위한 간단한 레이트 리미터
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15분
): boolean {
  const now = Date.now()
  const key = identifier
  
  const current = requestCounts.get(key)
  
  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (current.count >= maxRequests) {
    return false
  }
  
  current.count++
  return true
}

// 민감한 데이터 마스킹
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) return '*'.repeat(data.length)
  
  const visible = data.slice(-visibleChars)
  const masked = '*'.repeat(data.length - visibleChars)
  
  return masked + visible
}

// 로그에서 민감한 정보 제거
export function sanitizeLogData(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/password["\s]*[:=]["\s]*[^"'\s,}]+/gi, 'password: [REDACTED]')
      .replace(/token["\s]*[:=]["\s]*[^"'\s,}]+/gi, 'token: [REDACTED]')
      .replace(/secret["\s]*[:=]["\s]*[^"'\s,}]+/gi, 'secret: [REDACTED]')
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data }
    
    // 민감한 필드들 마스킹
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth']
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    return sanitized
  }
  
  return data
}

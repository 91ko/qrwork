// 환경 변수 검증 및 타입 안전성 보장

interface EnvConfig {
  DATABASE_URL: string
  JWT_SECRET: string
  SUPER_ADMIN_EMAIL: string
  SUPER_ADMIN_PASSWORD: string
  SUPER_ADMIN_NAME: string
  NEXT_PUBLIC_BASE_URL: string
  NODE_ENV: 'development' | 'production' | 'test'
}

// 필수 환경 변수 검증
function validateEnvConfig(): EnvConfig {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SUPER_ADMIN_EMAIL',
    'SUPER_ADMIN_PASSWORD',
    'SUPER_ADMIN_NAME'
  ]

  const missingVars: string[] = []

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    )
  }

  // JWT 시크릿 강도 검증 (배포 환경에서는 완화)
  const minJwtLength = process.env.NODE_ENV === 'production' ? 12 : 16
  if (process.env.JWT_SECRET!.length < minJwtLength) {
    throw new Error(`JWT_SECRET must be at least ${minJwtLength} characters long`)
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(process.env.SUPER_ADMIN_EMAIL!)) {
    throw new Error('SUPER_ADMIN_EMAIL must be a valid email address')
  }

  // 비밀번호 강도 검증 (배포 환경에서는 완화)
  const password = process.env.SUPER_ADMIN_PASSWORD!
  const minPasswordLength = process.env.NODE_ENV === 'production' ? 6 : 8
  if (password.length < minPasswordLength) {
    throw new Error(`SUPER_ADMIN_PASSWORD must be at least ${minPasswordLength} characters long`)
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL!,
    SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD!,
    SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME!,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development'
  }
}

// 환경 변수 설정 (한 번만 실행)
let envConfig: EnvConfig

try {
  envConfig = validateEnvConfig()
} catch (error) {
  console.error('Environment validation failed:', error)
  process.exit(1)
}

export { envConfig }

// 환경별 설정
export const config = {
  isDevelopment: envConfig.NODE_ENV === 'development',
  isProduction: envConfig.NODE_ENV === 'production',
  isTest: envConfig.NODE_ENV === 'test',
  
  // 보안 설정
  security: {
    jwtSecret: envConfig.JWT_SECRET,
    jwtExpiresIn: '7d',
    cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    bcryptRounds: 12,
    rateLimitWindow: 15 * 60 * 1000, // 15분
    rateLimitMax: 100, // 15분당 100회
  },
  
  // 데이터베이스 설정
  database: {
    url: envConfig.DATABASE_URL,
    maxConnections: 10,
    connectionTimeout: 30000,
  },
  
  // API 설정
  api: {
    baseUrl: envConfig.NEXT_PUBLIC_BASE_URL,
    timeout: 30000,
    maxRetries: 3,
  },
  
  // 로깅 설정
  logging: {
    level: envConfig.NODE_ENV === 'production' ? 'warn' : 'debug',
    enableConsole: true,
    enableFile: envConfig.NODE_ENV === 'production',
  }
}

// 환경 변수 마스킹 (로깅용)
export function getMaskedEnvConfig() {
  return {
    DATABASE_URL: envConfig.DATABASE_URL ? '***' : undefined,
    JWT_SECRET: envConfig.JWT_SECRET ? '***' : undefined,
    SUPER_ADMIN_EMAIL: envConfig.SUPER_ADMIN_EMAIL,
    SUPER_ADMIN_PASSWORD: '***',
    SUPER_ADMIN_NAME: envConfig.SUPER_ADMIN_NAME,
    NEXT_PUBLIC_BASE_URL: envConfig.NEXT_PUBLIC_BASE_URL,
    NODE_ENV: envConfig.NODE_ENV
  }
}

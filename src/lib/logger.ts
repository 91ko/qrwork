import { config } from './env-validation'
import { sanitizeLogData } from './security'

// 로그 레벨 정의
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

// 로그 인터페이스
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
  userId?: string
  companyId?: string
  ip?: string
  userAgent?: string
  requestId?: string
}

// 로거 클래스
class Logger {
  private logLevel: LogLevel

  constructor() {
    this.logLevel = config.logging.level === 'debug' ? LogLevel.DEBUG : 
                   config.logging.level === 'info' ? LogLevel.INFO :
                   config.logging.level === 'warn' ? LogLevel.WARN : LogLevel.ERROR
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private formatLog(entry: LogEntry): string {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR']
    const levelName = levelNames[entry.level]
    
    let logMessage = `[${entry.timestamp}] ${levelName}: ${entry.message}`
    
    if (entry.data) {
      logMessage += ` | Data: ${JSON.stringify(sanitizeLogData(entry.data))}`
    }
    
    if (entry.userId) {
      logMessage += ` | User: ${entry.userId}`
    }
    
    if (entry.companyId) {
      logMessage += ` | Company: ${entry.companyId}`
    }
    
    if (entry.ip) {
      logMessage += ` | IP: ${entry.ip}`
    }
    
    if (entry.requestId) {
      logMessage += ` | Request: ${entry.requestId}`
    }
    
    return logMessage
  }

  private log(level: LogLevel, message: string, data?: any, context?: {
    userId?: string
    companyId?: string
    ip?: string
    userAgent?: string
    requestId?: string
  }): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      ...context
    }

    const formattedLog = this.formatLog(entry)

    // 콘솔 출력
    if (config.logging.enableConsole) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedLog)
          break
        case LogLevel.INFO:
          console.info(formattedLog)
          break
        case LogLevel.WARN:
          console.warn(formattedLog)
          break
        case LogLevel.ERROR:
          console.error(formattedLog)
          break
      }
    }

    // 파일 로깅 (프로덕션에서만)
    if (config.logging.enableFile && config.isProduction) {
      this.writeToFile(formattedLog, level)
    }
  }

  private writeToFile(logMessage: string, level: LogLevel): void {
    // 실제 파일 로깅 구현
    // winston, pino 등의 로깅 라이브러리 사용 권장
    const fs = require('fs')
    const path = require('path')
    
    const logDir = path.join(process.cwd(), 'logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`)
    fs.appendFileSync(logFile, logMessage + '\n')
  }

  debug(message: string, data?: any, context?: any): void {
    this.log(LogLevel.DEBUG, message, data, context)
  }

  info(message: string, data?: any, context?: any): void {
    this.log(LogLevel.INFO, message, data, context)
  }

  warn(message: string, data?: any, context?: any): void {
    this.log(LogLevel.WARN, message, data, context)
  }

  error(message: string, data?: any, context?: any): void {
    this.log(LogLevel.ERROR, message, data, context)
  }

  // 보안 관련 로그
  security(message: string, data?: any, context?: any): void {
    this.warn(`[SECURITY] ${message}`, data, context)
  }

  // 인증 관련 로그
  auth(message: string, data?: any, context?: any): void {
    this.info(`[AUTH] ${message}`, data, context)
  }

  // 데이터베이스 관련 로그
  database(message: string, data?: any, context?: any): void {
    this.info(`[DATABASE] ${message}`, data, context)
  }

  // API 관련 로그
  api(message: string, data?: any, context?: any): void {
    this.info(`[API] ${message}`, data, context)
  }

  // 비즈니스 로직 로그
  business(message: string, data?: any, context?: any): void {
    this.info(`[BUSINESS] ${message}`, data, context)
  }
}

// 전역 로거 인스턴스
export const logger = new Logger()

// 요청 ID 생성
export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// 에러 로깅 헬퍼
export function logError(error: Error, context?: any): void {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  })
}

// 성능 로깅 헬퍼
export function logPerformance(operation: string, startTime: number, context?: any): void {
  const duration = Date.now() - startTime
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...context
  })
}

// 감사 로그 (중요한 작업 기록)
export function auditLog(action: string, details: any, context?: any): void {
  logger.info(`[AUDIT] ${action}`, details, context)
}

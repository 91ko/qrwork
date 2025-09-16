import { NextRequest } from 'next/server'
import { getPrismaClient } from './db-security'
import { logger } from './logger'
import { validateIPAddress } from './security'

// QR 스캔 보안 검증
export interface QRSecurityValidation {
  isValid: boolean
  error?: string
  location?: {
    latitude: number
    longitude: number
    radius: number
  }
}

// QR 스캔 보안 검증
export async function validateQRScan(
  qrData: string,
  username: string,
  request: NextRequest
): Promise<QRSecurityValidation> {
  try {
    // 1. QR 데이터 파싱 및 검증
    let parsedQrData
    try {
      parsedQrData = JSON.parse(qrData)
    } catch (error) {
      logger.security('잘못된 QR 데이터 형식', { 
        qrData: qrData.substring(0, 100),
        username,
        error: error.message 
      })
      return { isValid: false, error: '잘못된 QR 코드입니다.' }
    }

    const { companyCode, qrCodeId, type } = parsedQrData

    if (!companyCode || !qrCodeId || !type) {
      logger.security('QR 데이터 필수 필드 누락', { 
        companyCode, qrCodeId, type, username 
      })
      return { isValid: false, error: 'QR 코드 정보가 불완전합니다.' }
    }

    // 2. 회사 및 QR 코드 유효성 검증
    const prisma = getPrismaClient()
    
    const company = await prisma.company.findUnique({
      where: { code: companyCode }
    })

    if (!company || !company.isActive) {
      logger.security('존재하지 않는 회사 또는 비활성 회사', { 
        companyCode, username 
      })
      return { isValid: false, error: '유효하지 않은 회사입니다.' }
    }

    // 3. QR 코드 정보 조회
    const qrCode = await prisma.qrCode.findFirst({
      where: {
        id: qrCodeId,
        companyId: company.id,
        isActive: true
      }
    })

    if (!qrCode) {
      logger.security('존재하지 않는 QR 코드', { 
        qrCodeId, companyCode, username 
      })
      return { isValid: false, error: '유효하지 않은 QR 코드입니다.' }
    }

    // 4. 직원 정보 검증
    const employee = await prisma.employee.findFirst({
      where: {
        username: username,
        companyId: company.id,
        isActive: true
      }
    })

    if (!employee) {
      logger.security('존재하지 않는 직원', { 
        username, companyCode 
      })
      return { isValid: false, error: '존재하지 않는 직원입니다.' }
    }

    // 5. 위치 기반 검증 (GPS 정보가 있는 경우)
    if (qrCode.latitude && qrCode.longitude && qrCode.radius) {
      const locationValidation = await validateLocation(
        request,
        qrCode.latitude,
        qrCode.longitude,
        qrCode.radius
      )
      
      if (!locationValidation.isValid) {
        logger.security('위치 검증 실패', {
          username,
          qrCodeId,
          expectedLocation: {
            latitude: qrCode.latitude,
            longitude: qrCode.longitude,
            radius: qrCode.radius
          },
          error: locationValidation.error
        })
        return { isValid: false, error: locationValidation.error }
      }
    }

    // 6. 시간 기반 검증
    const timeValidation = validateTimeRestrictions(qrCode, type)
    if (!timeValidation.isValid) {
      logger.security('시간 제한 위반', {
        username,
        qrCodeId,
        type,
        error: timeValidation.error
      })
      return { isValid: false, error: timeValidation.error }
    }

    // 7. 중복 스캔 방지
    const duplicateValidation = await checkDuplicateScan(
      employee.id,
      qrCodeId,
      type
    )
    
    if (!duplicateValidation.isValid) {
      logger.security('중복 스캔 시도', {
        username,
        qrCodeId,
        type,
        error: duplicateValidation.error
      })
      return { isValid: false, error: duplicateValidation.error }
    }

    // 8. 스캔 기록 저장
    await recordScanAttempt(
      employee.id,
      qrCodeId,
      getClientIP(request),
      request.headers.get('user-agent') || 'unknown'
    )

    logger.auth('QR 스캔 성공', {
      username,
      qrCodeId,
      type,
      companyCode,
      location: qrCode.latitude && qrCode.longitude ? {
        latitude: qrCode.latitude,
        longitude: qrCode.longitude
      } : null
    })

    return {
      isValid: true,
      location: qrCode.latitude && qrCode.longitude ? {
        latitude: qrCode.latitude,
        longitude: qrCode.longitude,
        radius: qrCode.radius || 100
      } : undefined
    }

  } catch (error) {
    logger.error('QR 스캔 검증 에러', {
      error: error.message,
      username,
      qrData: qrData.substring(0, 100)
    })
    return { isValid: false, error: 'QR 스캔 검증 중 오류가 발생했습니다.' }
  }
}

// 위치 검증
async function validateLocation(
  request: NextRequest,
  expectedLat: number,
  expectedLng: number,
  radius: number
): Promise<{ isValid: boolean; error?: string }> {
  try {
    // 클라이언트에서 전송한 위치 정보 (실제로는 프론트엔드에서 전송)
    const clientLat = parseFloat(request.headers.get('x-latitude') || '0')
    const clientLng = parseFloat(request.headers.get('x-longitude') || '0')

    if (clientLat === 0 && clientLng === 0) {
      return { isValid: false, error: '위치 정보가 필요합니다.' }
    }

    // 거리 계산 (Haversine formula)
    const distance = calculateDistance(
      clientLat, clientLng,
      expectedLat, expectedLng
    )

    if (distance > radius) {
      return { 
        isValid: false, 
        error: `QR 코드 위치에서 ${Math.round(distance)}m 떨어져 있습니다. (허용 거리: ${radius}m)` 
      }
    }

    return { isValid: true }
  } catch (error) {
    logger.error('위치 검증 에러', { error: error.message })
    return { isValid: false, error: '위치 검증 중 오류가 발생했습니다.' }
  }
}

// 시간 제한 검증
function validateTimeRestrictions(
  qrCode: any,
  type: string
): { isValid: boolean; error?: string } {
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay() // 0 = 일요일, 6 = 토요일

  // 주말 제한 (필요시)
  if (currentDay === 0 || currentDay === 6) {
    // 주말에는 특별한 시간대만 허용하거나 제한
    if (currentHour < 8 || currentHour > 18) {
      return { isValid: false, error: '주말에는 8시~18시 사이에만 사용 가능합니다.' }
    }
  }

  // 평일 시간 제한
  if (currentDay >= 1 && currentDay <= 5) {
    if (type === 'CHECK_IN') {
      // 출근 시간: 6시~10시
      if (currentHour < 6 || currentHour > 10) {
        return { isValid: false, error: '출근은 6시~10시 사이에만 가능합니다.' }
      }
    } else if (type === 'CHECK_OUT') {
      // 퇴근 시간: 17시~23시
      if (currentHour < 17 || currentHour > 23) {
        return { isValid: false, error: '퇴근은 17시~23시 사이에만 가능합니다.' }
      }
    }
  }

  return { isValid: true }
}

// 중복 스캔 검증
async function checkDuplicateScan(
  employeeId: string,
  qrCodeId: string,
  type: string
): Promise<{ isValid: boolean; error?: string }> {
  const prisma = getPrismaClient()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 오늘 같은 타입의 기록이 있는지 확인
  const existingRecord = await prisma.attendance.findFirst({
    where: {
      employeeId,
      qrCodeId,
      type,
      timestamp: {
        gte: today,
        lt: tomorrow
      }
    }
  })

  if (existingRecord) {
    return { 
      isValid: false, 
      error: `오늘 이미 ${type === 'CHECK_IN' ? '출근' : '퇴근'} 기록이 있습니다.` 
    }
  }

  return { isValid: true }
}

// 스캔 시도 기록
async function recordScanAttempt(
  employeeId: string,
  qrCodeId: string,
  ip: string,
  userAgent: string
): Promise<void> {
  const prisma = getPrismaClient()
  
  try {
    // 스캔 로그 테이블이 있다면 여기에 기록
    // await prisma.scanLog.create({
    //   data: {
    //     employeeId,
    //     qrCodeId,
    //     ip,
    //     userAgent,
    //     timestamp: new Date()
    //   }
    // })
    
    logger.auth('QR 스캔 시도 기록', {
      employeeId,
      qrCodeId,
      ip,
      userAgent: userAgent.substring(0, 100)
    })
  } catch (error) {
    logger.error('스캔 기록 저장 실패', { error: error.message })
  }
}

// 거리 계산 (Haversine formula)
function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 클라이언트 IP 추출
function getClientIP(request: NextRequest): string {
  return request.ip || 
         request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown'
}

// QR 코드 보안 설정 검증
export function validateQRSecuritySettings(qrCode: any): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // 위치 정보가 없는 경우 경고
  if (!qrCode.latitude || !qrCode.longitude) {
    warnings.push('위치 정보가 설정되지 않아 어디서든 스캔 가능합니다.')
  }

  // 반경이 너무 큰 경우 경고
  if (qrCode.radius && qrCode.radius > 1000) {
    warnings.push('허용 반경이 너무 큽니다. (현재: ' + qrCode.radius + 'm)')
  }

  // QR 코드가 비활성화된 경우
  if (!qrCode.isActive) {
    return { isValid: false, warnings: ['QR 코드가 비활성화되어 있습니다.'] }
  }

  return { isValid: true, warnings }
}

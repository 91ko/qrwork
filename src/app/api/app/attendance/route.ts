import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db-security'
import { validateQRScan } from '@/lib/qr-security'
import { securityMiddleware, setSecurityHeaders, errorHandlingMiddleware } from '@/lib/security-middleware'
import { logger } from '@/lib/logger'

const prisma = getPrismaClient()

// QR 스캔을 통한 출퇴근 기록
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 15)
  
  try {
    // 보안 미들웨어 적용
    const securityResponse = securityMiddleware(request)
    if (securityResponse) {
      return setSecurityHeaders(securityResponse)
    }

    logger.api('QR 출퇴근 기록 API 호출', { requestId })
    
    const body = await request.json()
    const { qrData, username } = body

    // 유효성 검사
    if (!qrData || !username) {
      logger.warn('QR 출퇴근 기록 필수 필드 누락', { requestId, qrData: !!qrData, username: !!username })
      return NextResponse.json(
        { message: 'QR 데이터와 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // QR 스캔 보안 검증
    const securityValidation = await validateQRScan(qrData, username, request)
    if (!securityValidation.isValid) {
      logger.security('QR 스캔 보안 검증 실패', { 
        requestId, 
        username, 
        error: securityValidation.error 
      })
      return NextResponse.json(
        { message: securityValidation.error },
        { status: 400 }
      )
    }

    let parsedQrData
    try {
      parsedQrData = JSON.parse(qrData)
    } catch (error) {
      logger.security('QR 데이터 파싱 실패', { requestId, username, error: error instanceof Error ? error.message : 'Unknown error' })
      return NextResponse.json(
        { message: '잘못된 QR 코드입니다.' },
        { status: 400 }
      )
    }

    const { companyCode, qrCodeId, type } = parsedQrData

    // 회사 확인
    const company = await prisma.company.findUnique({
      where: { code: companyCode }
    })

    if (!company) {
      logger.security('존재하지 않는 회사', { requestId, companyCode, username })
      return NextResponse.json(
        { message: '존재하지 않는 회사입니다.' },
        { status: 404 }
      )
    }

    // 직원 확인
    const employee = await prisma.employee.findFirst({
      where: {
        username: username,
        companyId: company.id,
        isActive: true
      }
    })

    if (!employee) {
      logger.security('존재하지 않는 직원', { requestId, username, companyCode })
      return NextResponse.json(
        { message: '존재하지 않는 직원입니다.' },
        { status: 404 }
      )
    }

    // QR 코드 확인
    const qrCode = await prisma.qrCode.findFirst({
      where: {
        id: qrCodeId,
        companyId: company.id,
        isActive: true
      }
    })

    if (!qrCode) {
      logger.security('유효하지 않은 QR 코드', { requestId, qrCodeId, username, companyCode })
      return NextResponse.json(
        { message: '유효하지 않은 QR 코드입니다.' },
        { status: 404 }
      )
    }

    // 오늘 날짜의 출퇴근 기록 확인
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 마지막 기록 확인
    const lastAttendance = todayAttendances[0]
    let attendanceType = 'CHECK_IN'

    if (lastAttendance) {
      if (lastAttendance.type === 'CHECK_IN') {
        attendanceType = 'CHECK_OUT'
      } else {
        attendanceType = 'CHECK_IN'
      }
    }

    // 같은 타입의 중복 기록이 있는지 확인
    const existingSameType = todayAttendances.find(att => att.type === attendanceType)
    
    let attendance
    if (existingSameType) {
      // 중복 기록이 있으면 기존 기록 업데이트
      attendance = await prisma.attendance.update({
        where: { id: existingSameType.id },
        data: {
          timestamp: new Date(),
          location: qrCode.location || qrCode.name,
          qrCodeId: qrCode.id
        }
      })
    } else {
      // 새로운 기록 생성
      attendance = await prisma.attendance.create({
        data: {
          type: attendanceType,
          timestamp: new Date(),
          location: qrCode.location || qrCode.name,
          companyId: company.id,
          employeeId: employee.id,
          qrCodeId: qrCode.id
        }
      })
    }

    return NextResponse.json({
      message: `${attendanceType === 'CHECK_IN' ? '출근' : '퇴근'}이 기록되었습니다.`,
      attendance: attendance,
      employee: {
        name: employee.name,
        username: employee.username
      },
      type: attendanceType
    })

  } catch (error) {
    logger.error('QR 출퇴근 기록 에러', { 
      requestId, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return errorHandlingMiddleware(error instanceof Error ? error : new Error('Unknown error'), request)
  } finally {
    await prisma.disconnect()
  }
}

// 출퇴근 기록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const companyCode = searchParams.get('companyCode')
    const date = searchParams.get('date')

    if (!username || !companyCode) {
      return NextResponse.json(
        { message: '사용자 ID와 회사 코드가 필요합니다.' },
        { status: 400 }
      )
    }

    // 회사 확인
    const company = await prisma.company.findUnique({
      where: { code: companyCode }
    })

    if (!company) {
      return NextResponse.json(
        { message: '존재하지 않는 회사입니다.' },
        { status: 404 }
      )
    }

    // 직원 확인
    const employee = await prisma.employee.findFirst({
      where: {
        username: username,
        companyId: company.id
      }
    })

    if (!employee) {
      return NextResponse.json(
        { message: '존재하지 않는 직원입니다.' },
        { status: 404 }
      )
    }

    // 날짜 범위 설정
    let startDate = new Date()
    let endDate = new Date()
    
    if (date) {
      startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
    } else {
      startDate.setHours(0, 0, 0, 0)
      endDate.setDate(endDate.getDate() + 1)
    }

    // 출퇴근 기록 조회
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
        createdAt: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        qrCode: {
          select: {
            name: true,
            location: true
          }
        }
      }
    })

    return NextResponse.json({
      attendances: attendances,
      employee: {
        name: employee.name,
        username: employee.username
      },
      date: startDate.toISOString().split('T')[0]
    })

  } catch (error) {
    console.error('출퇴근 기록 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

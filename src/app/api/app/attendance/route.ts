import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// QR 스캔을 통한 출퇴근 기록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrData, employeeId } = body

    // 유효성 검사
    if (!qrData || !employeeId) {
      return NextResponse.json(
        { message: 'QR 데이터와 직원 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    let parsedQrData
    try {
      parsedQrData = JSON.parse(qrData)
    } catch (error) {
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
      return NextResponse.json(
        { message: '존재하지 않는 회사입니다.' },
        { status: 404 }
      )
    }

    // 직원 확인
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: company.id,
        isActive: true
      }
    })

    if (!employee) {
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

    // 출퇴근 기록 생성
    const attendance = await prisma.attendance.create({
      data: {
        type: attendanceType,
        timestamp: new Date(),
        location: qrCode.location || qrCode.name,
        companyId: company.id,
        employeeId: employee.id,
        qrCodeId: qrCode.id
      }
    })

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
    console.error('출퇴근 기록 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 출퇴근 기록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const companyCode = searchParams.get('companyCode')
    const date = searchParams.get('date')

    if (!employeeId || !companyCode) {
      return NextResponse.json(
        { message: '직원 ID와 회사 코드가 필요합니다.' },
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
        id: employeeId,
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
        employeeId: employee.employeeId
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

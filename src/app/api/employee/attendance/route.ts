import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// JWT 토큰에서 직원 정보 추출
async function getEmployeeFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('employee-token')?.value
    
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    return null
  }
}

// 출퇴근 기록
export async function POST(request: NextRequest) {
  try {
    const employee = await getEmployeeFromToken(request)
    
    if (!employee) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, companyCode } = body

    if (!type || !companyCode) {
      return NextResponse.json(
        { message: '출퇴근 타입과 회사 코드가 필요합니다.' },
        { status: 400 }
      )
    }

    if (type !== 'CHECK_IN' && type !== 'CHECK_OUT') {
      return NextResponse.json(
        { message: '잘못된 출퇴근 타입입니다.' },
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

    if (company.id !== employee.companyId) {
      return NextResponse.json(
        { message: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // 직원 확인
    const employeeRecord = await prisma.employee.findUnique({
      where: { id: employee.employeeId }
    })

    if (!employeeRecord) {
      return NextResponse.json(
        { message: '존재하지 않는 직원입니다.' },
        { status: 404 }
      )
    }

    // 마지막 출퇴근 기록 확인
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.employeeId
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // 출퇴근 로직 검증
    if (lastAttendance) {
      // 같은 타입의 기록이 이미 있는지 확인 (같은 날짜)
      const today = new Date()
      const lastDate = new Date(lastAttendance.timestamp)
      
      if (lastDate.toDateString() === today.toDateString()) {
        if (lastAttendance.type === type) {
          return NextResponse.json(
            { message: `이미 ${type === 'CHECK_IN' ? '출근' : '퇴근'} 기록이 있습니다.` },
            { status: 400 }
          )
        }
      }
    } else {
      // 첫 기록인 경우 출근만 가능
      if (type !== 'CHECK_IN') {
        return NextResponse.json(
          { message: '첫 기록은 출근만 가능합니다.' },
          { status: 400 }
        )
      }
    }

    // 출퇴근 기록 생성
    const attendance = await prisma.attendance.create({
      data: {
        type,
        timestamp: new Date(),
        employeeId: employee.id,
        companyId: company.id,
        qrCodeId: null // QR 스캔이 아닌 직접 기록
      }
    })

    return NextResponse.json({
      message: `${type === 'CHECK_IN' ? '출근' : '퇴근'}이 성공적으로 기록되었습니다.`,
      attendance: attendance
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

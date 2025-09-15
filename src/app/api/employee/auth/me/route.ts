import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('employee-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // 직원 정보 조회
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.employeeId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            trialEndDate: true,
            isActive: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { message: '존재하지 않는 직원입니다.' },
        { status: 404 }
      )
    }

    if (!employee.isActive) {
      return NextResponse.json(
        { message: '비활성화된 계정입니다.' },
        { status: 403 }
      )
    }

    if (!employee.company.isActive) {
      return NextResponse.json(
        { message: '비활성화된 회사입니다.' },
        { status: 403 }
      )
    }

    // 무료 체험 만료 확인
    if (new Date() > employee.company.trialEndDate) {
      return NextResponse.json(
        { message: '무료 체험이 만료되었습니다.' },
        { status: 403 }
      )
    }

    // 마지막 출퇴근 기록 조회
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        email: employee.email,
        company: employee.company
      },
      lastAttendance: lastAttendance
    })

  } catch (error) {
    console.error('직원 인증 확인 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

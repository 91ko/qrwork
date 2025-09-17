import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPrismaClient } from '@/lib/db-security'
import { setCorsHeaders, setSecurityHeaders } from '@/lib/security-middleware'

// Prisma 클라이언트 인스턴스 생성
const prisma = getPrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('employee-token')?.value
    
    if (!token) {
      const response = NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-production'
    const decoded = jwt.verify(token, jwtSecret) as any
    
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
      const response = NextResponse.json(
        { message: '존재하지 않는 직원입니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (!employee.isActive) {
      const response = NextResponse.json(
        { message: '비활성화된 계정입니다.' },
        { status: 403 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (!employee.company.isActive) {
      const response = NextResponse.json(
        { message: '비활성화된 회사입니다.' },
        { status: 403 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 무료 체험 만료 확인 (5인 미만은 평생무료)
    const company = await prisma.company.findUnique({
      where: { id: employee.company.id }
    })
    
    if (company && company.maxEmployees > 5 && new Date() > employee.company.trialEndDate) {
      const response = NextResponse.json(
        { message: '무료 체험이 만료되었습니다.' },
        { status: 403 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
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

    const response = NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        email: employee.email,
        phone: employee.phone,
        company: employee.company
      },
      lastAttendance: lastAttendance
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('직원 인증 확인 에러:', error)
    const errorResponse = NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
    return setCorsHeaders(setSecurityHeaders(errorResponse), request)
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Prisma 연결 해제 에러:', disconnectError)
    }
  }
}

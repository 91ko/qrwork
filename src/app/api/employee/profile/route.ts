import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPrismaClient } from '@/lib/db-security'
import { setCorsHeaders, setSecurityHeaders } from '@/lib/security-middleware'

// Prisma 클라이언트 인스턴스 생성
const prisma = getPrismaClient()

// JWT 토큰에서 직원 정보 추출
async function getEmployeeFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('employee-token')?.value
    
    if (!token) {
      return null
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-production'
    const decoded = jwt.verify(token, jwtSecret) as any
    return decoded
  } catch (error) {
    return null
  }
}

// 직원 프로필 수정
export async function PUT(request: NextRequest) {
  try {
    const employee = await getEmployeeFromToken(request)
    
    if (!employee) {
      const response = NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const body = await request.json()
    const { name, email, phone } = body

    // 유효성 검사
    if (!name || name.trim().length === 0) {
      const response = NextResponse.json(
        { message: '이름을 입력해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 이메일 형식 검사
    if (email && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        const response = NextResponse.json(
          { message: '올바른 이메일 형식을 입력해주세요.' },
          { status: 400 }
        )
        return setCorsHeaders(setSecurityHeaders(response), request)
      }
    }

    // 직원 정보 업데이트
    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.employeeId },
      data: {
        name: name.trim(),
        email: email && email.trim().length > 0 ? email.trim() : null,
        phone: phone && phone.trim().length > 0 ? phone.trim() : null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    const response = NextResponse.json({
      message: '프로필이 성공적으로 업데이트되었습니다.',
      employee: updatedEmployee
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('프로필 업데이트 에러:', error)
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

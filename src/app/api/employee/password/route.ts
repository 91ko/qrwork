import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

// 직원 비밀번호 변경
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
    const { currentPassword, newPassword } = body

    // 유효성 검사
    if (!currentPassword || !newPassword) {
      const response = NextResponse.json(
        { message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (newPassword.length < 6) {
      const response = NextResponse.json(
        { message: '새 비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 현재 직원 정보 조회
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employee.employeeId }
    })

    if (!existingEmployee) {
      const response = NextResponse.json(
        { message: '직원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingEmployee.password)
    if (!isCurrentPasswordValid) {
      const response = NextResponse.json(
        { message: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 새 비밀번호 해시화
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // 비밀번호 업데이트
    await prisma.employee.update({
      where: { id: employee.employeeId },
      data: {
        password: hashedNewPassword
      }
    })

    const response = NextResponse.json({
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('비밀번호 변경 에러:', error)
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

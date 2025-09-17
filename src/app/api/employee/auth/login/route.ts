import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { setCorsHeaders, setSecurityHeaders } from '@/lib/security-middleware'

const prisma = new PrismaClient()

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return setCorsHeaders(setSecurityHeaders(response), request)
}

export async function POST(request: NextRequest) {
  try {
    const { username, password, companyCode } = await request.json()

    if (!username || !password || !companyCode) {
      const response = NextResponse.json(
        { message: '사용자 ID, 비밀번호, 회사 코드를 모두 입력해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 회사 확인
    const company = await prisma.company.findUnique({
      where: { code: companyCode }
    })

    if (!company) {
      const response = NextResponse.json(
        { message: '존재하지 않는 회사 코드입니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (!company.isActive) {
      const response = NextResponse.json(
        { message: '비활성화된 회사입니다.' },
        { status: 403 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 무료 체험 만료 확인
    if (new Date() > company.trialEndDate) {
      const response = NextResponse.json(
        { message: '무료 체험이 만료되었습니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 직원 확인 (대소문자 구분 없이)
    const employee = await prisma.employee.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        },
        companyId: company.id,
        isActive: true
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

    if (!employee) {
      const response = NextResponse.json(
        { message: '존재하지 않는 직원 계정이거나 비활성화된 계정입니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, employee.password)
    if (!isPasswordValid) {
      const response = NextResponse.json(
        { message: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
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

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        employeeId: employee.id, 
        companyId: company.id, 
        username: employee.username 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    const response = NextResponse.json({
      message: '로그인 성공',
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        email: employee.email,
        company: employee.company
      },
      lastAttendance: lastAttendance
    })

    // HTTP-only 쿠키에 토큰 저장
    response.cookies.set('employee-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24시간
    })

    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('직원 로그인 에러:', error)
    const errorResponse = NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
    return setCorsHeaders(setSecurityHeaders(errorResponse), request)
  } finally {
    await prisma.$disconnect()
  }
}

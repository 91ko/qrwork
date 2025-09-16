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
    const body = await request.json()
    const { email, password, companyCode } = body

    // 유효성 검사
    if (!email || !password || !companyCode) {
      const response = NextResponse.json(
        { message: '이메일, 비밀번호, 회사 코드를 모두 입력해주세요.' },
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
        { message: '무료 체험이 만료되었습니다. 유료 플랜으로 업그레이드해주세요.' },
        { status: 403 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 관리자 확인
    const admin = await prisma.admin.findFirst({
      where: {
        email: email,
        companyId: company.id
      }
    })

    if (!admin) {
      const response = NextResponse.json(
        { message: '존재하지 않는 관리자 계정입니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (!admin.isActive) {
      const response = NextResponse.json(
        { message: '비활성화된 관리자 계정입니다.' },
        { status: 403 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      const response = NextResponse.json(
        { message: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        adminId: admin.id,
        companyId: company.id,
        companyCode: company.code,
        email: admin.email,
        role: admin.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // 응답 생성
    const response = NextResponse.json({
      message: '로그인 성공',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
        trialEndDate: company.trialEndDate
      }
    })

    // HTTP-only 쿠키에 토큰 저장
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    })

    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('로그인 에러:', error)
    const errorResponse = NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
    return setCorsHeaders(setSecurityHeaders(errorResponse), request)
  } finally {
    await prisma.$disconnect()
  }
}

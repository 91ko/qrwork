import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // 입력값 검증
    if (!email || !password) {
      return NextResponse.json(
        { message: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 최종 관리자 조회
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!superAdmin) {
      return NextResponse.json(
        { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    if (!superAdmin.isActive) {
      return NextResponse.json(
        { message: '비활성화된 계정입니다.' },
        { status: 401 }
      )
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, superAdmin.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // JWT 토큰 생성
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다.')
    }

    const token = jwt.sign(
      {
        superAdminId: superAdmin.id,
        email: superAdmin.email,
        role: 'SUPER_ADMIN'
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    // 쿠키 설정
    const response = NextResponse.json({
      message: '로그인 성공',
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email
      }
    })

    response.cookies.set('superAdminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7일
    })

    return response

  } catch (error) {
    console.error('최종 관리자 로그인 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

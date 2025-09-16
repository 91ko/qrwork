import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

// 수동으로 최종 관리자 계정 생성 (디버깅용)
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // 입력값 검증
    if (!email || !password) {
      return NextResponse.json(
        { message: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 이미 존재하는지 확인
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingSuperAdmin) {
      return NextResponse.json(
        { message: '이미 존재하는 계정입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 12)

    // 최종 관리자 계정 생성
    const superAdmin = await prisma.superAdmin.create({
      data: {
        name: name || '최종 관리자',
        email: email.toLowerCase(),
        password: hashedPassword,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      message: '최종 관리자 계정이 성공적으로 생성되었습니다.',
      superAdmin
    })

  } catch (error) {
    console.error('최종 관리자 계정 생성 에러:', error)
    return NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

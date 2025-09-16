import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

// 최종 관리자 계정 초기화 (환경변수에서 읽어서 생성)
export async function POST(request: NextRequest) {
  try {
    // 환경변수에서 최종 관리자 정보 읽기
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD
    const superAdminName = process.env.SUPER_ADMIN_NAME || '최종 관리자'

    if (!superAdminEmail || !superAdminPassword) {
      return NextResponse.json(
        { message: '최종 관리자 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    // 이미 최종 관리자가 존재하는지 확인
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: superAdminEmail }
    })

    if (existingSuperAdmin) {
      return NextResponse.json(
        { message: '최종 관리자 계정이 이미 존재합니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12)

    // 최종 관리자 계정 생성
    const superAdmin = await prisma.superAdmin.create({
      data: {
        name: superAdminName,
        email: superAdminEmail,
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
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 최종 관리자 계정 상태 확인
export async function GET(request: NextRequest) {
  try {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL

    if (!superAdminEmail) {
      return NextResponse.json(
        { message: '최종 관리자 환경변수가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: superAdminEmail },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!superAdmin) {
      return NextResponse.json({
        exists: false,
        message: '최종 관리자 계정이 존재하지 않습니다.'
      })
    }

    return NextResponse.json({
      exists: true,
      superAdmin
    })

  } catch (error) {
    console.error('최종 관리자 계정 확인 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

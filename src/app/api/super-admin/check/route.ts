import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 최종 관리자 계정 상태 및 환경변수 확인
export async function GET(request: NextRequest) {
  try {
    // 환경변수 확인
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD
    const superAdminName = process.env.SUPER_ADMIN_NAME

    const envStatus = {
      email: superAdminEmail ? '설정됨' : '미설정',
      password: superAdminPassword ? '설정됨' : '미설정',
      name: superAdminName || '미설정'
    }

    // 데이터베이스에서 최종 관리자 계정 확인
    let dbStatus = null
    if (superAdminEmail) {
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

      dbStatus = superAdmin ? {
        exists: true,
        name: superAdmin.name,
        email: superAdmin.email,
        isActive: superAdmin.isActive,
        createdAt: superAdmin.createdAt
      } : {
        exists: false,
        message: '계정이 존재하지 않습니다.'
      }
    }

    return NextResponse.json({
      environment: envStatus,
      database: dbStatus,
      message: '최종 관리자 계정 상태를 확인했습니다.'
    })

  } catch (error) {
    console.error('최종 관리자 계정 확인 에러:', error)
    return NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  }
}

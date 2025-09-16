import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

// 기본 구독 플랜 초기화
export async function POST(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 기존 플랜이 있는지 확인
    const existingPlans = await prisma.subscriptionPlan.count()
    if (existingPlans > 0) {
      return NextResponse.json(
        { message: '이미 구독 플랜이 존재합니다.' },
        { status: 409 }
      )
    }

    // 기본 구독 플랜 생성
    const defaultPlans = [
      {
        name: '기본',
        description: '소규모 팀을 위한 기본 플랜',
        price: 50000, // 5만원
        maxEmployees: 10,
        features: JSON.stringify([
          '출퇴근 관리',
          'QR 코드 스캔',
          '기본 통계',
          '이메일 지원'
        ])
      },
      {
        name: '프리미엄',
        description: '중간 규모 팀을 위한 프리미엄 플랜',
        price: 100000, // 10만원
        maxEmployees: 50,
        features: JSON.stringify([
          '출퇴근 관리',
          'QR 코드 스캔',
          '고급 통계 및 분석',
          '휴가 관리',
          'API 접근',
          '우선 지원'
        ])
      },
      {
        name: '엔터프라이즈',
        description: '대규모 기업을 위한 엔터프라이즈 플랜',
        price: 200000, // 20만원
        maxEmployees: 200,
        features: JSON.stringify([
          '출퇴근 관리',
          'QR 코드 스캔',
          '고급 통계 및 분석',
          '휴가 관리',
          'API 접근',
          '커스텀 필드',
          '전용 계정 관리자',
          '24/7 지원',
          'SSO 연동'
        ])
      }
    ]

    const createdPlans = await prisma.subscriptionPlan.createMany({
      data: defaultPlans
    })

    return NextResponse.json({
      message: '기본 구독 플랜이 성공적으로 생성되었습니다.',
      createdCount: createdPlans.count
    })

  } catch (error) {
    console.error('구독 플랜 초기화 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

// 구독 플랜 목록 조회
export async function GET(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' }
    })

    return NextResponse.json({ plans })

  } catch (error) {
    console.error('구독 플랜 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 구독 플랜 생성
export async function POST(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { name, description, price, maxEmployees, features } = await request.json()

    if (!name || !price || !maxEmployees) {
      return NextResponse.json(
        { message: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        price: parseInt(price),
        maxEmployees: parseInt(maxEmployees),
        features: features ? JSON.stringify(features) : null
      }
    })

    return NextResponse.json({
      message: '구독 플랜이 성공적으로 생성되었습니다.',
      plan
    })

  } catch (error) {
    console.error('구독 플랜 생성 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

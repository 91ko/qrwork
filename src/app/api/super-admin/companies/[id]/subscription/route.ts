import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

// 회사 구독 정보 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { id } = params

    const subscriptions = await prisma.companySubscription.findMany({
      where: { companyId: id },
      include: {
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })

    const payments = await prisma.payment.findMany({
      where: { companyId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({ 
      subscriptions,
      payments
    })

  } catch (error) {
    console.error('회사 구독 정보 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 회사 구독 생성/수정
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { id } = params

    const { 
      planId, 
      startDate, 
      endDate, 
      autoRenew = true,
      paymentAmount,
      paymentMethod = 'MANUAL',
      description
    } = await request.json()

    if (!planId || !startDate || !endDate) {
      return NextResponse.json(
        { message: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 기존 활성 구독을 만료 처리
    await prisma.companySubscription.updateMany({
      where: {
        companyId: id,
        status: 'ACTIVE'
      },
      data: {
        status: 'EXPIRED'
      }
    })

    // 새 구독 생성
    const subscription = await prisma.companySubscription.create({
      data: {
        companyId: id,
        planId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        autoRenew,
        status: 'ACTIVE'
      },
      include: {
        plan: true
      }
    })

    // 회사 정보 업데이트
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    await prisma.company.update({
      where: { id },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionEndDate: new Date(endDate),
        maxEmployees: plan?.maxEmployees || 10,
        isActive: true,
        isApproved: true
      }
    })

    // 결제 기록 생성 (선택사항)
    if (paymentAmount) {
      await prisma.payment.create({
        data: {
          companyId: id,
          subscriptionId: subscription.id,
          amount: parseInt(paymentAmount),
          status: 'COMPLETED',
          paymentMethod,
          description: description || `${plan?.name} 구독 결제`,
          paidAt: new Date()
        }
      })
    }

    return NextResponse.json({
      message: '구독이 성공적으로 설정되었습니다.',
      subscription
    })

  } catch (error) {
    console.error('회사 구독 설정 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 구독 연장
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { id } = params

    const { extendMonths = 1, paymentAmount, paymentMethod = 'MANUAL' } = await request.json()

    // 현재 활성 구독 조회
    const currentSubscription = await prisma.companySubscription.findFirst({
      where: {
        companyId: id,
        status: 'ACTIVE'
      },
      include: {
        plan: true
      }
    })

    if (!currentSubscription) {
      return NextResponse.json(
        { message: '활성 구독을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 구독 종료일 연장
    const newEndDate = new Date(currentSubscription.endDate)
    newEndDate.setMonth(newEndDate.getMonth() + extendMonths)

    const updatedSubscription = await prisma.companySubscription.update({
      where: { id: currentSubscription.id },
      data: {
        endDate: newEndDate
      },
      include: {
        plan: true
      }
    })

    // 회사 정보 업데이트
    await prisma.company.update({
      where: { id },
      data: {
        subscriptionEndDate: newEndDate
      }
    })

    // 결제 기록 생성 (선택사항)
    if (paymentAmount) {
      await prisma.payment.create({
        data: {
          companyId: id,
          subscriptionId: currentSubscription.id,
          amount: parseInt(paymentAmount),
          status: 'COMPLETED',
          paymentMethod,
          description: `${currentSubscription.plan.name} 구독 ${extendMonths}개월 연장`,
          paidAt: new Date()
        }
      })
    }

    return NextResponse.json({
      message: `구독이 ${extendMonths}개월 연장되었습니다.`,
      subscription: updatedSubscription
    })

  } catch (error) {
    console.error('구독 연장 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

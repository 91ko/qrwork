import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

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
    const { action, subscriptionEndDate, maxEmployees } = await request.json()

    // 회사 조회
    const company = await prisma.company.findUnique({
      where: { id }
    })

    if (!company) {
      return NextResponse.json(
        { message: '회사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    if (action === 'APPROVE') {
      updateData = {
        isApproved: true,
        subscriptionStatus: 'ACTIVE',
        subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
        maxEmployees: maxEmployees || company.maxEmployees
      }
    } else if (action === 'REJECT') {
      updateData = {
        isApproved: false,
        subscriptionStatus: 'SUSPENDED'
      }
    } else if (action === 'EXTEND') {
      updateData = {
        subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
        subscriptionStatus: 'ACTIVE'
      }
    } else if (action === 'SUSPEND') {
      updateData = {
        subscriptionStatus: 'SUSPENDED'
      }
    } else if (action === 'ACTIVATE') {
      updateData = {
        subscriptionStatus: 'ACTIVE'
      }
    }

    // 회사 정보 업데이트
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            admins: true,
            employees: true,
            attendances: true
          }
        }
      }
    })

    return NextResponse.json({
      message: '회사 정보가 성공적으로 업데이트되었습니다.',
      company: updatedCompany
    })

  } catch (error) {
    console.error('회사 승인/거부 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

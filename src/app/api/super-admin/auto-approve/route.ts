import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

// 14일 후 자동 승인 시스템
export async function POST(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 14일이 지난 회사들 조회
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const expiredCompanies = await prisma.company.findMany({
      where: {
        createdAt: {
          lte: fourteenDaysAgo
        },
        isApproved: false,
        subscriptionStatus: 'TRIAL'
      },
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

    console.log(`14일이 지난 회사 수: ${expiredCompanies.length}`)

    const results = []

    for (const company of expiredCompanies) {
      try {
        // 회사 상태를 만료로 변경
        const updatedCompany = await prisma.company.update({
          where: { id: company.id },
          data: {
            subscriptionStatus: 'EXPIRED',
            isActive: false
          }
        })

        results.push({
          companyId: company.id,
          companyName: company.name,
          companyCode: company.code,
          status: 'EXPIRED',
          message: '14일 체험 기간 만료로 비활성화됨'
        })

        console.log(`회사 만료 처리: ${company.name} (${company.code})`)
      } catch (error) {
        console.error(`회사 ${company.name} 처리 중 오류:`, error)
        results.push({
          companyId: company.id,
          companyName: company.name,
          companyCode: company.code,
          status: 'ERROR',
          message: '처리 중 오류 발생'
        })
      }
    }

    return NextResponse.json({
      message: '14일 후 자동 처리 완료',
      processedCount: results.length,
      results
    })

  } catch (error) {
    console.error('자동 승인 처리 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 입금 확인 후 자동 승인
export async function PUT(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { companyId, subscriptionEndDate, maxEmployees } = await request.json()

    if (!companyId) {
      return NextResponse.json(
        { message: '회사 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 회사 조회
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json(
        { message: '회사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 입금 확인 후 승인 처리
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        isApproved: true,
        subscriptionStatus: 'ACTIVE',
        isActive: true,
        subscriptionEndDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
        maxEmployees: maxEmployees || company.maxEmployees
      },
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
      message: '입금 확인 후 승인 처리 완료',
      company: updatedCompany
    })

  } catch (error) {
    console.error('입금 확인 후 승인 처리 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

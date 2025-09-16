import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

// 회사 목록 조회
export async function GET(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'ALL'

    const skip = (page - 1) * limit

    // 검색 조건
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status !== 'ALL') {
      where.subscriptionStatus = status
    }

    // 회사 목록 조회
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          _count: {
            select: {
              admins: true,
              employees: true,
              attendances: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.company.count({ where })
    ])

    // 회사별 통계 계산
    const companiesWithStats = companies.map(company => {
      const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(company.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      const isTrialExpired = new Date() > new Date(company.trialEndDate)
      const isSubscriptionExpired = company.subscriptionEndDate && new Date() > new Date(company.subscriptionEndDate)

      return {
        ...company,
        daysSinceCreated,
        isTrialExpired,
        isSubscriptionExpired,
        totalAdmins: company._count.admins,
        totalEmployees: company._count.employees,
        totalAttendances: company._count.attendances
      }
    })

    return NextResponse.json({
      companies: companiesWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error) {
    console.error('회사 목록 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

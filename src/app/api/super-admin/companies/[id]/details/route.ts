import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

// 회사 상세 정보 조회
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

    // 회사 상세 정보 조회
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        admins: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true
          }
        },
        employees: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true
          }
        },
        qrCodes: {
          select: {
            id: true,
            name: true,
            location: true,
            isActive: true,
            createdAt: true
          }
        },
        attendances: {
          select: {
            id: true,
            type: true,
            timestamp: true,
            location: true
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 10 // 최근 10개만
        },
        leaveRequests: {
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // 최근 10개만
        },
        _count: {
          select: {
            admins: true,
            employees: true,
            qrCodes: true,
            attendances: true,
            leaveRequests: true,
            employeeLeaves: true
          }
        }
      }
    })

    if (!company) {
      return NextResponse.json(
        { message: '회사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 통계 계산
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

    // 이번 달 출퇴근 기록
    const thisMonthAttendances = await prisma.attendance.count({
      where: {
        companyId: id,
        timestamp: {
          gte: thisMonth
        }
      }
    })

    // 지난 달 출퇴근 기록
    const lastMonthAttendances = await prisma.attendance.count({
      where: {
        companyId: id,
        timestamp: {
          gte: lastMonth,
          lt: thisMonth
        }
      }
    })

    // 오늘 출퇴근 기록
    const todayStart = new Date(today)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const todayAttendances = await prisma.attendance.count({
      where: {
        companyId: id,
        timestamp: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    })

    // 활성 직원 수 (최근 7일 내 로그인)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const activeEmployees = await prisma.employee.count({
      where: {
        companyId: id,
        lastLoginAt: {
          gte: sevenDaysAgo
        }
      }
    })

    const companyDetails = {
      ...company,
      statistics: {
        totalAdmins: company._count.admins,
        totalEmployees: company._count.employees,
        totalQrCodes: company._count.qrCodes,
        totalAttendances: company._count.attendances,
        totalLeaveRequests: company._count.leaveRequests,
        thisMonthAttendances,
        lastMonthAttendances,
        todayAttendances,
        activeEmployees,
        attendanceGrowth: lastMonthAttendances > 0 
          ? ((thisMonthAttendances - lastMonthAttendances) / lastMonthAttendances * 100).toFixed(1)
          : 0
      }
    }

    return NextResponse.json({ company: companyDetails })

  } catch (error) {
    console.error('회사 상세 정보 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

// JWT 토큰에서 관리자 정보 추출
async function getAdminFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    return null
  }
}

// 출퇴근 통계 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)

    // 기본 통계
    const totalEmployees = await prisma.employee.count({
      where: {
        companyId: admin.companyId,
        isActive: true
      }
    })

    const totalAttendances = await prisma.attendance.count({
      where: {
        companyId: admin.companyId
      }
    })

    // 오늘 날짜
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayCheckIns = await prisma.attendance.count({
      where: {
        companyId: admin.companyId,
        type: 'CHECK_IN',
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    const todayCheckOuts = await prisma.attendance.count({
      where: {
        companyId: admin.companyId,
        type: 'CHECK_OUT',
        timestamp: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // 월별 통계
    let monthlyStats = null
    if (period === 'month') {
      const startDate = new Date(month + '-01')
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)

      const monthlyAttendances = await prisma.attendance.findMany({
        where: {
          companyId: admin.companyId,
          timestamp: {
            gte: startDate,
            lt: endDate
          }
        },
        include: {
          employee: true
        }
      })

      // 평균 출근/퇴근 시간 계산
      const checkIns = monthlyAttendances.filter(a => a.type === 'CHECK_IN')
      const checkOuts = monthlyAttendances.filter(a => a.type === 'CHECK_OUT')

      const avgCheckInHour = checkIns.length > 0 
        ? checkIns.reduce((sum, a) => sum + new Date(a.timestamp).getHours(), 0) / checkIns.length
        : 9
      const avgCheckOutHour = checkOuts.length > 0 
        ? checkOuts.reduce((sum, a) => sum + new Date(a.timestamp).getHours(), 0) / checkOuts.length
        : 18

      // 총 근무 시간 계산 (간단한 추정)
      const totalHours = checkIns.length * 8 // 평균 8시간 근무로 가정

      monthlyStats = {
        month: month,
        totalDays: new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate(),
        averageCheckIn: `${Math.floor(avgCheckInHour)}:${Math.floor((avgCheckInHour % 1) * 60).toString().padStart(2, '0')}`,
        averageCheckOut: `${Math.floor(avgCheckOutHour)}:${Math.floor((avgCheckOutHour % 1) * 60).toString().padStart(2, '0')}`,
        totalHours: totalHours
      }
    }

    // 주별 통계
    let weeklyStats = []
    if (period === 'week') {
      const weekDays = ['월', '화', '수', '목', '금', '토', '일']
      const today = new Date()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1) // 월요일부터 시작

      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(startOfWeek)
        dayStart.setDate(startOfWeek.getDate() + i)
        dayStart.setHours(0, 0, 0, 0)
        
        const dayEnd = new Date(dayStart)
        dayEnd.setDate(dayStart.getDate() + 1)

        const dayCheckIns = await prisma.attendance.count({
          where: {
            companyId: admin.companyId,
            type: 'CHECK_IN',
            timestamp: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        })

        const dayCheckOuts = await prisma.attendance.count({
          where: {
            companyId: admin.companyId,
            type: 'CHECK_OUT',
            timestamp: {
              gte: dayStart,
              lt: dayEnd
            }
          }
        })

        weeklyStats.push({
          day: weekDays[i],
          checkIns: dayCheckIns,
          checkOuts: dayCheckOuts,
          totalHours: dayCheckIns * 8 // 평균 8시간 근무로 가정
        })
      }
    }

    // 직원별 통계
    const employees = await prisma.employee.findMany({
      where: {
        companyId: admin.companyId,
        isActive: true
      },
      include: {
        attendances: {
          where: {
            timestamp: {
              gte: new Date(month + '-01'),
              lt: new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1))
            }
          }
        }
      }
    })

    const employeeStats = employees.map(employee => {
      const checkIns = employee.attendances.filter(a => a.type === 'CHECK_IN')
      const checkOuts = employee.attendances.filter(a => a.type === 'CHECK_OUT')
      const totalDays = checkIns.length
      const averageHours = totalDays > 0 ? (checkOuts.length * 8) / totalDays : 0
      const lateCount = checkIns.filter(a => new Date(a.timestamp).getHours() > 9).length

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        totalDays,
        averageHours,
        lateCount
      }
    })

    const stats = {
      totalEmployees,
      totalAttendances,
      todayCheckIns,
      todayCheckOuts,
      monthlyStats,
      weeklyStats,
      employeeStats
    }

    return NextResponse.json({
      stats
    })

  } catch (error) {
    console.error('통계 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

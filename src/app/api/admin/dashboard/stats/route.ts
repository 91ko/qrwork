import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 오늘 날짜
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 통계 데이터 조회
    const [
      totalEmployees,
      activeEmployees,
      todayAttendances,
      qrCodes
    ] = await Promise.all([
      // 총 직원 수
      prisma.employee.count({
        where: { companyId: admin.companyId }
      }),
      
      // 활성 직원 수 (오늘 출근한 직원)
      prisma.attendance.count({
        where: {
          companyId: admin.companyId,
          type: 'CHECK_IN',
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        },
        distinct: ['employeeId']
      }),
      
      // 오늘 출퇴근 기록 수
      prisma.attendance.count({
        where: {
          companyId: admin.companyId,
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // QR 코드 수
      prisma.qrCode.count({
        where: { companyId: admin.companyId }
      })
    ])

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      todayAttendances,
      qrCodes
    })

  } catch (error) {
    console.error('대시보드 통계 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

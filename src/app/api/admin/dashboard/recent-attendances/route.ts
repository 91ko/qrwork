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

    // 최근 출퇴근 기록 조회 (최근 10개)
    const recentAttendances = await prisma.attendance.findMany({
      where: {
        companyId: admin.companyId
      },
      include: {
        employee: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    })

    const formattedAttendances = recentAttendances.map(attendance => ({
      id: attendance.id,
      employeeName: attendance.employee.name,
      type: attendance.type,
      timestamp: attendance.timestamp.toISOString()
    }))

    return NextResponse.json(formattedAttendances)

  } catch (error) {
    console.error('최근 출퇴근 기록 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

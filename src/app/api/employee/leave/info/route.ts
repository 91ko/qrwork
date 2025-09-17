import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

// JWT 토큰에서 직원 정보 추출
async function getEmployeeFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('employee-token')?.value
    
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    return null
  }
}

// 직원 연차 정보 조회
export async function GET(request: NextRequest) {
  try {
    const employee = await getEmployeeFromToken(request)
    
    if (!employee) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const currentYear = new Date().getFullYear()

    // 직원 연차 정보 조회
    let leaveInfo = await prisma.employeeLeave.findFirst({
      where: {
        employeeId: employee.employeeId,
        year: currentYear
      }
    })

    // 연차 정보가 없으면 기본값으로 생성
    if (!leaveInfo) {
      leaveInfo = await prisma.employeeLeave.create({
        data: {
          employeeId: employee.employeeId,
          companyId: employee.companyId,
          year: currentYear,
          totalDays: 0, // 관리자가 부여할 때까지 0일
          usedDays: 0,
          remainingDays: 0
        }
      })
    }

    return NextResponse.json({
      leaveInfo: {
        totalDays: leaveInfo.totalDays,
        usedDays: leaveInfo.usedDays,
        remainingDays: leaveInfo.remainingDays,
        year: leaveInfo.year
      }
    })

  } catch (error) {
    console.error('직원 연차 정보 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

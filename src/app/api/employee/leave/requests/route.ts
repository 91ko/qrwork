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

// 직원 휴가 신청 목록 조회
export async function GET(request: NextRequest) {
  try {
    const employee = await getEmployeeFromToken(request)
    
    if (!employee) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 휴가 신청 목록 조회
    const requests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: employee.employeeId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      requests: requests
    })

  } catch (error) {
    console.error('직원 휴가 신청 목록 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

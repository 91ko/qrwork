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

// 직원 휴가 신청
export async function POST(request: NextRequest) {
  try {
    const employee = await getEmployeeFromToken(request)
    
    if (!employee) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, startDate, endDate, days, reason } = body

    // 유효성 검사
    if (!type || !startDate || !endDate || !days) {
      return NextResponse.json(
        { message: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 날짜 유효성 검사
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start >= end) {
      return NextResponse.json(
        { message: '종료일은 시작일보다 늦어야 합니다.' },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { message: '과거 날짜는 선택할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 연차 정보 확인
    const currentYear = new Date().getFullYear()
    let leaveInfo = await prisma.employeeLeave.findFirst({
      where: {
        employeeId: employee.employeeId,
        year: currentYear
      }
    })

    if (!leaveInfo) {
      // 연차 정보가 없으면 기본값으로 생성
      leaveInfo = await prisma.employeeLeave.create({
        data: {
          employeeId: employee.employeeId,
          companyId: employee.companyId,
          year: currentYear,
          totalDays: 15,
          usedDays: 0,
          remainingDays: 15
        }
      })
    }

    // 남은 연차 확인
    if (days > leaveInfo.remainingDays) {
      return NextResponse.json(
        { message: '남은 연차 일수가 부족합니다.' },
        { status: 400 }
      )
    }

    // 중복 신청 확인 (같은 기간)
    const existingRequest = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: employee.employeeId,
        status: {
          in: ['PENDING', 'APPROVED']
        },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } }
            ]
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } }
            ]
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } }
            ]
          }
        ]
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { message: '이미 신청된 기간과 겹치는 휴가가 있습니다.' },
        { status: 400 }
      )
    }

    // 휴가 신청 생성
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        type,
        startDate: start,
        endDate: end,
        days,
        reason: reason || null,
        employeeId: employee.employeeId,
        companyId: employee.companyId
      }
    })

    return NextResponse.json({
      message: '휴가 신청이 완료되었습니다.',
      request: leaveRequest
    })

  } catch (error) {
    console.error('휴가 신청 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

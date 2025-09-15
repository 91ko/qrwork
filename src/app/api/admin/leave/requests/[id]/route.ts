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

// 휴가 신청 승인/반려
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { status, adminNote } = body

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { message: '올바른 상태를 선택해주세요.' },
        { status: 400 }
      )
    }

    // 휴가 신청 조회
    const leaveRequest = await prisma.leaveRequest.findFirst({
      where: {
        id: params.id,
        companyId: admin.companyId
      },
      include: {
        employee: true
      }
    })

    if (!leaveRequest) {
      return NextResponse.json(
        { message: '휴가 신청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (leaveRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: '이미 처리된 신청입니다.' },
        { status: 400 }
      )
    }

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      // 휴가 신청 상태 업데이트
      await tx.leaveRequest.update({
        where: { id: params.id },
        data: {
          status,
          adminNote: adminNote || null
        }
      })

      // 승인된 경우 연차 사용 일수 업데이트
      if (status === 'APPROVED') {
        const currentYear = new Date().getFullYear()
        
        // 직원 연차 정보 조회 또는 생성
        let employeeLeave = await tx.employeeLeave.findFirst({
          where: {
            employeeId: leaveRequest.employeeId,
            year: currentYear
          }
        })

        if (!employeeLeave) {
          employeeLeave = await tx.employeeLeave.create({
            data: {
              employeeId: leaveRequest.employeeId,
              companyId: admin.companyId,
              year: currentYear,
              totalDays: 15, // 기본 15일
              usedDays: 0,
              remainingDays: 15
            }
          })
        }

        // 사용 연차 업데이트
        await tx.employeeLeave.update({
          where: { id: employeeLeave.id },
          data: {
            usedDays: employeeLeave.usedDays + leaveRequest.days,
            remainingDays: employeeLeave.totalDays - (employeeLeave.usedDays + leaveRequest.days)
          }
        })
      }
    })

    return NextResponse.json({
      message: status === 'APPROVED' ? '휴가가 승인되었습니다.' : '휴가가 반려되었습니다.'
    })

  } catch (error) {
    console.error('휴가 신청 처리 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

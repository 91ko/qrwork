import { NextRequest, NextResponse } from 'next/server'
import { getAdminFromToken } from '@/lib/admin-auth'
import { getPrismaClient } from '@/lib/db-security'
import { setCorsHeaders, setSecurityHeaders } from '@/lib/security-middleware'
import { logger } from '@/lib/logger'

const prisma = getPrismaClient()

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return setCorsHeaders(setSecurityHeaders(response), request)
}

// 출퇴근 기록 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromToken(request)
    if (!admin) {
      const response = NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const { id } = await params
    const body = await request.json()
    const { timestamp, type, location } = body

    // 입력 검증
    if (!timestamp || !type) {
      const response = NextResponse.json(
        { message: '시간과 타입은 필수입니다.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (!['CHECK_IN', 'CHECK_OUT'].includes(type)) {
      const response = NextResponse.json(
        { message: '올바른 타입을 입력해주세요. (CHECK_IN 또는 CHECK_OUT)' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 출퇴근 기록 조회
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: id,
        employee: {
          companyId: admin.companyId
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            companyId: true
          }
        }
      }
    })

    if (!attendance) {
      const response = NextResponse.json(
        { message: '출퇴근 기록을 찾을 수 없습니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 출퇴근 기록 수정
    const updatedAttendance = await prisma.attendance.update({
      where: { id: id },
      data: {
        timestamp: new Date(timestamp),
        type: type,
        location: location || null
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            customFields: true
          }
        }
      }
    })

    logger.api('출퇴근 기록 수정됨', {
      attendanceId: id,
      employeeId: attendance.employee.id,
      adminId: admin.adminId,
      oldTimestamp: attendance.timestamp,
      newTimestamp: updatedAttendance.timestamp,
      type: updatedAttendance.type
    })

    const response = NextResponse.json({
      message: '출퇴근 기록이 성공적으로 수정되었습니다.',
      attendance: updatedAttendance
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('출퇴근 기록 수정 에러:', error)
    const errorResponse = NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
    return setCorsHeaders(setSecurityHeaders(errorResponse), request)
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Prisma 연결 해제 에러:', disconnectError)
    }
  }
}

// 출퇴근 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromToken(request)
    if (!admin) {
      const response = NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const { id } = await params

    // 출퇴근 기록 조회
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: id,
        employee: {
          companyId: admin.companyId
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            companyId: true
          }
        }
      }
    })

    if (!attendance) {
      const response = NextResponse.json(
        { message: '출퇴근 기록을 찾을 수 없습니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 출퇴근 기록 삭제
    await prisma.attendance.delete({
      where: { id: id }
    })

    logger.api('출퇴근 기록 삭제됨', {
      attendanceId: id,
      employeeId: attendance.employee.id,
      adminId: admin.adminId,
      timestamp: attendance.timestamp,
      type: attendance.type
    })

    const response = NextResponse.json({
      message: '출퇴근 기록이 성공적으로 삭제되었습니다.'
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('출퇴근 기록 삭제 에러:', error)
    const errorResponse = NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
    return setCorsHeaders(setSecurityHeaders(errorResponse), request)
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Prisma 연결 해제 에러:', disconnectError)
    }
  }
}
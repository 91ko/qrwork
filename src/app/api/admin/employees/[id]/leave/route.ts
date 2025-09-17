import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPrismaClient } from '@/lib/db-security'
import { setCorsHeaders, setSecurityHeaders } from '@/lib/security-middleware'

// Prisma 클라이언트 인스턴스 생성
const prisma = getPrismaClient()

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return setCorsHeaders(setSecurityHeaders(response), request)
}

// JWT 토큰에서 관리자 정보 추출
async function getAdminFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return null
    }

    // 환경 변수에서 JWT 시크릿 가져오기 (fallback 포함)
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-production'
    
    const decoded = jwt.verify(token, jwtSecret) as any
    return decoded
  } catch (error) {
    return null
  }
}

// 직원 연차 정보 조회
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      const response = NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const { id: employeeId } = await params
    const currentYear = new Date().getFullYear()

    // 직원 연차 정보 조회
    const leaveInfo = await prisma.employeeLeave.findFirst({
      where: {
        employeeId: employeeId,
        companyId: admin.companyId,
        year: currentYear
      }
    })

    const response = NextResponse.json({
      leaveInfo: leaveInfo || {
        totalDays: 0,
        usedDays: 0,
        remainingDays: 0,
        year: currentYear
      }
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('직원 연차 정보 조회 에러:', error)
    const errorResponse = NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
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

// 직원 연차 부여/수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      const response = NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const { id: employeeId } = await params
    const { totalDays } = await request.json()

    if (typeof totalDays !== 'number' || totalDays < 0) {
      const response = NextResponse.json(
        { message: '올바른 연차 일수를 입력해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const currentYear = new Date().getFullYear()

    // 기존 연차 정보 조회
    const existingLeaveInfo = await prisma.employeeLeave.findFirst({
      where: {
        employeeId: employeeId,
        companyId: admin.companyId,
        year: currentYear
      }
    })

    let leaveInfo
    if (existingLeaveInfo) {
      // 기존 연차 정보 업데이트
      leaveInfo = await prisma.employeeLeave.update({
        where: { id: existingLeaveInfo.id },
        data: {
          totalDays: totalDays,
          remainingDays: totalDays - existingLeaveInfo.usedDays
        }
      })
    } else {
      // 새로운 연차 정보 생성
      leaveInfo = await prisma.employeeLeave.create({
        data: {
          employeeId: employeeId,
          companyId: admin.companyId,
          year: currentYear,
          totalDays: totalDays,
          usedDays: 0,
          remainingDays: totalDays
        }
      })
    }

    const response = NextResponse.json({
      message: '연차가 성공적으로 부여되었습니다.',
      leaveInfo: leaveInfo
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('연차 부여 에러:', error)
    const errorResponse = NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
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

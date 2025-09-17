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

// 근로계약서 전송
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      const response = NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 유료 기능 확인 (5인 이상 회사만 사용 가능)
    const company = await prisma.company.findUnique({
      where: { id: admin.companyId }
    })

    if (!company || company.maxEmployees <= 5) {
      const response = NextResponse.json(
        { message: '이 기능은 6인 이상 회사에서만 사용할 수 있습니다.' },
        { status: 403 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const { id: contractId } = await params

    // 근로계약서 존재 확인
    const existingContract = await prisma.employmentContract.findFirst({
      where: {
        id: contractId,
        companyId: admin.companyId
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!existingContract) {
      const response = NextResponse.json(
        { message: '존재하지 않는 근로계약서입니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 초안 상태에서만 전송 가능
    if (existingContract.status !== 'DRAFT') {
      const response = NextResponse.json(
        { message: '이미 전송된 계약서입니다.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 계약서 상태를 전송됨으로 변경
    const contract = await prisma.employmentContract.update({
      where: { id: contractId },
      data: {
        status: 'SENT',
        sentAt: new Date()
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // TODO: 실제 이메일 전송 로직 구현
    // 여기서는 상태만 변경하고, 실제 이메일 전송은 별도 서비스에서 처리

    const response = NextResponse.json({
      message: '근로계약서가 직원에게 전송되었습니다.',
      contract: contract
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('근로계약서 전송 에러:', error)
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

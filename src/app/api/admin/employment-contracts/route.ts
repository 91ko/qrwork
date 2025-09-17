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

// 근로계약서 목록 조회
export async function GET(request: NextRequest) {
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

    const contracts = await prisma.employmentContract.findMany({
      where: {
        companyId: admin.companyId
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const response = NextResponse.json({
      contracts: contracts
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('근로계약서 목록 조회 에러:', error)
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

// 근로계약서 생성
export async function POST(request: NextRequest) {
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

    const { employeeId, title, content } = await request.json()

    if (!employeeId || !title || !content) {
      const response = NextResponse.json(
        { message: '직원 ID, 제목, 내용을 모두 입력해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 직원 존재 확인
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId: admin.companyId,
        isActive: true
      }
    })

    if (!employee) {
      const response = NextResponse.json(
        { message: '존재하지 않는 직원입니다.' },
        { status: 404 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const contract = await prisma.employmentContract.create({
      data: {
        title: String(title),
        content: String(content),
        companyId: String(admin.companyId),
        employeeId: String(employeeId),
        createdById: String(admin.adminId),
        status: 'DRAFT'
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

    const response = NextResponse.json({
      message: '근로계약서가 생성되었습니다.',
      contract: contract
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('근로계약서 생성 에러:', error)
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

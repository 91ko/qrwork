import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

// 직원 목록 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const employees = await prisma.employee.findMany({
      where: {
        companyId: admin.companyId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const response = NextResponse.json({
      employees: employees
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('직원 목록 조회 에러:', error)
    const errorResponse = NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
    return setCorsHeaders(setSecurityHeaders(errorResponse), request)
  } finally {
    await prisma.$disconnect()
  }
}

// 직원 등록
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

    const body = await request.json()
    const { name, email, phone, username, password, customFields } = body

    // 유효성 검사
    if (!name || !username || !password) {
      const response = NextResponse.json(
        { message: '이름, 사용자 ID, 비밀번호는 필수입니다.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 사용자 ID 중복 확인
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        username: username,
        companyId: admin.companyId
      }
    })

    if (existingEmployee) {
      const response = NextResponse.json(
        { message: '이미 사용 중인 사용자 ID입니다.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12)

    // 커스텀 필드 안전하게 처리
    let customFieldsJson = '{}'
    try {
      if (customFields && Array.isArray(customFields)) {
        // 배열인 경우 객체로 변환
        const customFieldsObj: Record<string, string> = {}
        customFields.forEach(field => {
          if (field && field.name && field.value !== undefined) {
            customFieldsObj[field.name] = String(field.value || '')
          }
        })
        customFieldsJson = JSON.stringify(customFieldsObj)
      } else if (customFields && typeof customFields === 'object') {
        customFieldsJson = JSON.stringify(customFields)
      } else if (typeof customFields === 'string') {
        // 이미 JSON 문자열인 경우 검증
        JSON.parse(customFields)
        customFieldsJson = customFields
      }
    } catch (jsonError) {
      console.error('커스텀 필드 JSON 파싱 에러:', jsonError)
      customFieldsJson = '{}'
    }

    console.log('직원 생성 데이터:', {
      name,
      email: email || null,
      phone: phone || null,
      username,
      customFields: customFieldsJson,
      companyId: admin.companyId
    })

    // 직원 생성
    const employee = await prisma.employee.create({
      data: {
        name: String(name),
        email: email ? String(email) : null,
        phone: phone ? String(phone) : null,
        username: String(username),
        password: hashedPassword,
        customFields: customFieldsJson,
        isActive: true,
        companyId: String(admin.companyId)
      }
    })

    const response = NextResponse.json({
      message: '직원이 성공적으로 등록되었습니다.',
      employee: employee
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('직원 등록 에러:', error)
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

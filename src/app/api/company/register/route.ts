import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrismaClient } from '@/lib/db-security'
import { sanitizeInput, validateEmail, validatePassword } from '@/lib/security'
import { securityMiddleware, setSecurityHeaders, setCorsHeaders, errorHandlingMiddleware } from '@/lib/security-middleware'
// import { logger } from '@/lib/logger' // 임시 비활성화

// Prisma 클라이언트 인스턴스 생성
const prisma = getPrismaClient()

// 회사 고유 코드 생성 함수
function generateCompanyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return setCorsHeaders(setSecurityHeaders(response), request)
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 15)
  
  try {
    // 보안 미들웨어 적용 (CORS 문제로 인해 임시 비활성화)
    // const securityResponse = securityMiddleware(request)
    // if (securityResponse) {
    //   return setSecurityHeaders(securityResponse)
    // }

    console.log('회사 등록 API 호출됨', { requestId })
    
    const body = await request.json()
    console.log('받은 데이터', { requestId, body: sanitizeInput(JSON.stringify(body)) })
    
    const { 
      companyName, 
      companyPhone, 
      adminName, 
      email, 
      password, 
      confirmPassword, 
      agreeTerms 
    } = body

    // 입력 데이터 정화
    const sanitizedData = {
      companyName: sanitizeInput(companyName),
      companyPhone: sanitizeInput(companyPhone),
      adminName: sanitizeInput(adminName),
      email: sanitizeInput(email),
      password: sanitizeInput(password),
      confirmPassword: sanitizeInput(confirmPassword),
      agreeTerms: Boolean(agreeTerms)
    }

    // 유효성 검사
    if (!sanitizedData.companyName || !sanitizedData.adminName || !sanitizedData.email || !sanitizedData.password) {
      console.warn('필수 필드 누락', { requestId, sanitizedData })
      const response = NextResponse.json(
        { message: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 이메일 형식 검증
    if (!validateEmail(sanitizedData.email)) {
      console.warn('잘못된 이메일 형식', { requestId, email: sanitizedData.email })
      const response = NextResponse.json(
        { message: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 비밀번호 강도 검증
    const passwordValidation = validatePassword(sanitizedData.password)
    if (!passwordValidation.isValid) {
      console.warn('약한 비밀번호', { requestId, errors: passwordValidation.errors })
      const response = NextResponse.json(
        { message: '비밀번호 요구사항을 만족하지 않습니다.', errors: passwordValidation.errors },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (sanitizedData.password !== sanitizedData.confirmPassword) {
      console.warn('비밀번호 불일치', { requestId })
      const response = NextResponse.json(
        { message: '비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (!sanitizedData.agreeTerms) {
      console.warn('이용약관 미동의', { requestId })
      const response = NextResponse.json(
        { message: '이용약관에 동의해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 데이터베이스 연결 테스트
    console.log('데이터베이스 연결 테스트 중...', { requestId })
    await prisma.connect()
    console.log('데이터베이스 연결 성공', { requestId })

    // 이메일 중복 확인
    console.log('이메일 중복 확인 중...')
    const existingAdmin = await prisma.admin.findFirst({
      where: { email }
    })
    console.log('이메일 중복 확인 완료:', existingAdmin ? '중복됨' : '사용 가능')

    if (existingAdmin) {
      const response = NextResponse.json(
        { message: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 회사 코드 생성 (중복 확인)
    let companyCode: string
    let isUnique = false
    let attempts = 0

    while (!isUnique && attempts < 10) {
      companyCode = generateCompanyCode()
      const existingCompany = await prisma.company.findUnique({
        where: { code: companyCode }
      })
      
      if (!existingCompany) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      const response = NextResponse.json(
        { message: '회사 코드 생성에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12)

    // 무료 체험 종료일 설정
    // 5명 이하는 평생무료 (2099년까지), 그 외는 3개월 무료
    const trialEndDate = new Date()
    if (maxEmployees <= 5) {
      // 5명 이하는 평생무료 (2099년 12월 31일)
      trialEndDate.setFullYear(2099, 11, 31)
    } else {
      // 6명 이상은 3개월 무료
      trialEndDate.setDate(trialEndDate.getDate() + 90)
    }

    // 트랜잭션으로 회사와 관리자 생성
    const result = await prisma.$transaction(async (tx: any) => {
      // 회사 생성
      const company = await tx.company.create({
        data: {
          name: companyName,
          code: companyCode!,
          phone: companyPhone || null,
          trialEndDate,
          maxEmployees: 10,
          isActive: true
        }
      })

      // 관리자 생성
      const admin = await tx.admin.create({
        data: {
          name: adminName,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true,
          companyId: company.id
        }
      })

      return { company, admin }
    })

    const response = NextResponse.json({
      message: '회사 등록이 완료되었습니다.',
      companyCode: result.company.code,
      companyName: result.company.name,
      trialEndDate: result.company.trialEndDate
    })
    
    // CORS 헤더 설정
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('회사 등록 에러:', error)
    const errorResponse = NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined
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

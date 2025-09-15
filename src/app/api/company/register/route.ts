import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

// Prisma 클라이언트 인스턴스 생성
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// 회사 고유 코드 생성 함수
function generateCompanyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    console.log('회사 등록 API 호출됨')
    
    const body = await request.json()
    console.log('받은 데이터:', body)
    
    const { 
      companyName, 
      companyPhone, 
      adminName, 
      email, 
      password, 
      confirmPassword, 
      agreeTerms 
    } = body

    // 유효성 검사
    if (!companyName || !adminName || !email || !password) {
      return NextResponse.json(
        { message: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { message: '비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      )
    }

    if (!agreeTerms) {
      return NextResponse.json(
        { message: '이용약관에 동의해주세요.' },
        { status: 400 }
      )
    }

    // 데이터베이스 연결 테스트
    console.log('데이터베이스 연결 테스트 중...')
    await prisma.$connect()
    console.log('데이터베이스 연결 성공')

    // 이메일 중복 확인
    console.log('이메일 중복 확인 중...')
    const existingAdmin = await prisma.admin.findFirst({
      where: { email }
    })
    console.log('이메일 중복 확인 완료:', existingAdmin ? '중복됨' : '사용 가능')

    if (existingAdmin) {
      return NextResponse.json(
        { message: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      )
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
      return NextResponse.json(
        { message: '회사 코드 생성에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12)

    // 무료 체험 종료일 (14일 후)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

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

    return NextResponse.json({
      message: '회사 등록이 완료되었습니다.',
      companyCode: result.company.code,
      companyName: result.company.name,
      trialEndDate: result.company.trialEndDate
    })

  } catch (error) {
    console.error('회사 등록 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

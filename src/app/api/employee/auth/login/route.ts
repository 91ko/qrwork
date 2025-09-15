import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { username, password, companyCode } = await request.json()

    if (!username || !password || !companyCode) {
      return NextResponse.json(
        { message: '사용자 ID, 비밀번호, 회사 코드를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 회사 확인
    const company = await prisma.company.findUnique({
      where: { code: companyCode }
    })

    if (!company) {
      return NextResponse.json(
        { message: '존재하지 않는 회사 코드입니다.' },
        { status: 404 }
      )
    }

    if (!company.isActive) {
      return NextResponse.json(
        { message: '비활성화된 회사입니다.' },
        { status: 403 }
      )
    }

    // 무료 체험 만료 확인
    if (new Date() > company.trialEndDate) {
      return NextResponse.json(
        { message: '무료 체험이 만료되었습니다. 관리자에게 문의하세요.' },
        { status: 403 }
      )
    }

    // 직원 확인
    const employee = await prisma.employee.findFirst({
      where: {
        username: username,
        companyId: company.id,
        isActive: true
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json(
        { message: '존재하지 않는 직원 계정이거나 비활성화된 계정입니다.' },
        { status: 404 }
      )
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, employee.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      )
    }

    // 마지막 출퇴근 기록 조회
    const lastAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        employeeId: employee.id, 
        companyId: company.id, 
        username: employee.username 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    const response = NextResponse.json({
      message: '로그인 성공',
      employee: {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        email: employee.email,
        company: employee.company
      },
      lastAttendance: lastAttendance
    })

    // HTTP-only 쿠키에 토큰 저장
    response.cookies.set('employee-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24시간
    })

    return response

  } catch (error) {
    console.error('직원 로그인 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

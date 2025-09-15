import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
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

    return NextResponse.json({
      employees: employees
    })

  } catch (error) {
    console.error('직원 목록 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 직원 등록
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, username, password, customFields } = body

    // 유효성 검사
    if (!name || !username || !password) {
      return NextResponse.json(
        { message: '이름, 사용자 ID, 비밀번호는 필수입니다.' },
        { status: 400 }
      )
    }

    // 사용자 ID 중복 확인
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        username: username,
        companyId: admin.companyId
      }
    })

    if (existingEmployee) {
      return NextResponse.json(
        { message: '이미 사용 중인 사용자 ID입니다.' },
        { status: 400 }
      )
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12)

    // 직원 생성
    const employee = await prisma.employee.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        username,
        password: hashedPassword,
        customFields: customFields ? JSON.stringify(customFields) : '{}',
        isActive: true,
        companyId: admin.companyId
      }
    })

    return NextResponse.json({
      message: '직원이 성공적으로 등록되었습니다.',
      employee: employee
    })

  } catch (error) {
    console.error('직원 등록 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

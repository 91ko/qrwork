import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

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
    const { name, email, phone, employeeId, department, position } = body

    // 유효성 검사
    if (!name) {
      return NextResponse.json(
        { message: '직원 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사번 중복 확인
    if (employeeId) {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          employeeId: employeeId,
          companyId: admin.companyId
        }
      })

      if (existingEmployee) {
        return NextResponse.json(
          { message: '이미 사용 중인 사번입니다.' },
          { status: 400 }
        )
      }
    }

    // 직원 생성
    const employee = await prisma.employee.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        employeeId: employeeId || null,
        department: department || null,
        position: position || null,
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

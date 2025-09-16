import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

// JWT 토큰에서 직원 정보 추출
async function getEmployeeFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('employee-token')?.value
    
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
    return null
  }
}

// 직원 비밀번호 변경
export async function PUT(request: NextRequest) {
  try {
    const employee = await getEmployeeFromToken(request)
    
    if (!employee) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // 유효성 검사
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: '현재 비밀번호와 새 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { message: '새 비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      )
    }

    // 현재 직원 정보 조회
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employee.employeeId }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { message: '직원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingEmployee.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { message: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 새 비밀번호 해시화
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // 비밀번호 업데이트
    await prisma.employee.update({
      where: { id: employee.employeeId },
      data: {
        password: hashedNewPassword
      }
    })

    return NextResponse.json({
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })

  } catch (error) {
    console.error('비밀번호 변경 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

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

// 직원 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 직원이 해당 회사에 속하는지 확인
    const employee = await prisma.employee.findFirst({
      where: {
        id: id,
        companyId: admin.companyId
      }
    })

    if (!employee) {
      return NextResponse.json(
        { message: '직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 직원 삭제 (관련 출퇴근 기록도 함께 삭제)
    await prisma.$transaction(async (tx) => {
      // 출퇴근 기록 삭제
      await tx.attendance.deleteMany({
        where: {
          employeeId: id
        }
      })

      // 직원 삭제
      await tx.employee.delete({
        where: {
          id: id
        }
      })
    })

    return NextResponse.json({
      message: '직원이 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('직원 삭제 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// 직원 정보 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, email, phone, username, password, isActive } = body

    // 직원이 해당 회사에 속하는지 확인
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: id,
        companyId: admin.companyId
      }
    })

    if (!existingEmployee) {
      return NextResponse.json(
        { message: '직원을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 사용자 ID 중복 확인 (자신 제외)
    if (username && username !== existingEmployee.username) {
      const duplicateEmployee = await prisma.employee.findFirst({
        where: {
          username: username,
          companyId: admin.companyId,
          id: { not: id }
        }
      })

      if (duplicateEmployee) {
        return NextResponse.json(
          { message: '이미 사용 중인 사용자 ID입니다.' },
          { status: 400 }
        )
      }
    }

    // 업데이트할 데이터 준비
    const updateData: any = {
      name: name || existingEmployee.name,
      email: email || existingEmployee.email,
      phone: phone || existingEmployee.phone,
      username: username || existingEmployee.username,
      isActive: isActive !== undefined ? isActive : existingEmployee.isActive
    }

    // 비밀번호가 제공된 경우에만 해시화하여 업데이트
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    // 직원 정보 수정
    const updatedEmployee = await prisma.employee.update({
      where: { id: id },
      data: updateData
    })

    return NextResponse.json({
      message: '직원 정보가 성공적으로 수정되었습니다.',
      employee: updatedEmployee
    })

  } catch (error) {
    console.error('직원 수정 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

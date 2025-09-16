import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

async function getAdminFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      include: { company: true }
    })

    return admin
  } catch (error) {
    return null
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromToken(request)
    if (!admin) {
      return NextResponse.json({ message: '인증이 필요합니다.' }, { status: 401 })
    }

    const { id } = await params

    // 출퇴근 기록이 해당 관리자의 회사에 속하는지 확인
    const attendance = await prisma.attendance.findFirst({
      where: {
        id: id,
        employee: {
          companyId: admin.companyId
        }
      },
      include: {
        employee: {
          select: {
            name: true,
            username: true
          }
        }
      }
    })

    if (!attendance) {
      return NextResponse.json({ message: '출퇴근 기록을 찾을 수 없습니다.' }, { status: 404 })
    }

    // 출퇴근 기록 삭제
    await prisma.attendance.delete({
      where: { id: id }
    })

    return NextResponse.json({ 
      message: '출퇴근 기록이 성공적으로 삭제되었습니다.',
      deletedAttendance: {
        id: attendance.id,
        type: attendance.type,
        timestamp: attendance.timestamp,
        employeeName: attendance.employee.name,
        employeeUsername: attendance.employee.username
      }
    })

  } catch (error) {
    console.error('출퇴근 기록 삭제 에러:', error)
    return NextResponse.json({ 
      message: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

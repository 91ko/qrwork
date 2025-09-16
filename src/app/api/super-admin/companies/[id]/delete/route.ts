import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

// 업체 삭제 기능
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { id } = params

    // 회사 조회
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            admins: true,
            employees: true,
            attendances: true,
            qrCodes: true,
            leaveRequests: true,
            employeeLeaves: true
          }
        }
      }
    })

    if (!company) {
      return NextResponse.json(
        { message: '회사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 삭제 전 데이터 백업 정보
    const backupInfo = {
      companyName: company.name,
      companyCode: company.code,
      totalAdmins: company._count.admins,
      totalEmployees: company._count.employees,
      totalAttendances: company._count.attendances,
      totalQrCodes: company._count.qrCodes,
      totalLeaveRequests: company._count.leaveRequests,
      totalEmployeeLeaves: company._count.employeeLeaves,
      createdAt: company.createdAt,
      deletedAt: new Date()
    }

    // 회사 삭제 (Cascade로 관련 데이터도 함께 삭제됨)
    await prisma.company.delete({
      where: { id }
    })

    console.log(`회사 삭제 완료: ${company.name} (${company.code})`)

    return NextResponse.json({
      message: '회사가 성공적으로 삭제되었습니다.',
      deletedCompany: backupInfo
    })

  } catch (error) {
    console.error('회사 삭제 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

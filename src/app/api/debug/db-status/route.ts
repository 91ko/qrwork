import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('데이터베이스 상태 확인 중...')
    
    // 데이터베이스 연결 테스트
    await prisma.$connect()
    console.log('데이터베이스 연결 성공')

    // 각 테이블의 데이터 개수 확인
    const companyCount = await prisma.company.count()
    const adminCount = await prisma.admin.count()
    const employeeCount = await prisma.employee.count()
    const qrCodeCount = await prisma.qrCode.count()
    const attendanceCount = await prisma.attendance.count()

    // 최근 회사 데이터 확인
    const recentCompanies = await prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        admins: {
          select: {
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    })

    return NextResponse.json({
      message: '데이터베이스 상태 확인 완료',
      counts: {
        companies: companyCount,
        admins: adminCount,
        employees: employeeCount,
        qrCodes: qrCodeCount,
        attendances: attendanceCount
      },
      recentCompanies: recentCompanies,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('데이터베이스 상태 확인 에러:', error)
    return NextResponse.json(
      { 
        message: '데이터베이스 상태 확인 실패',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    )
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Prisma 연결 해제 에러:', disconnectError)
    }
  }
}

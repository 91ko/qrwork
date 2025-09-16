import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
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

// 통계 내보내기
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7)

    // 직원별 통계 데이터 조회
    const employees = await prisma.employee.findMany({
      where: {
        companyId: admin.companyId,
        isActive: true
      },
      include: {
        attendances: {
          where: {
            timestamp: {
              gte: new Date(month + '-01'),
              lt: new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1))
            }
          }
        }
      }
    })

    // CSV 헤더
    const csvHeaders = ['직원명', '사용자명', '총 근무일', '평균 근무시간', '지각 횟수', '출근 횟수', '퇴근 횟수']
    
    // CSV 데이터 생성
    const csvRows = employees.map(employee => {
      const checkIns = employee.attendances.filter(a => a.type === 'CHECK_IN')
      const checkOuts = employee.attendances.filter(a => a.type === 'CHECK_OUT')
      const totalDays = checkIns.length
      const averageHours = totalDays > 0 ? (checkOuts.length * 8) / totalDays : 0
      const lateCount = checkIns.filter(a => new Date(a.timestamp).getHours() > 9).length

      return [
        employee.name,
        employee.username,
        totalDays.toString(),
        averageHours.toFixed(1),
        lateCount.toString(),
        checkIns.length.toString(),
        checkOuts.length.toString()
      ]
    })

    // CSV 내용 생성
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    // UTF-8 BOM 추가 (한글 지원)
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance_statistics_${month}.csv"`
      }
    })

  } catch (error) {
    console.error('통계 내보내기 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

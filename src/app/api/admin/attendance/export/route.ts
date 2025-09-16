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

// 출퇴근 기록 Excel 내보내기
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
    const search = searchParams.get('search') || ''
    const date = searchParams.get('date') || ''
    const month = searchParams.get('month') || ''
    const additionalDate = searchParams.get('additionalDate') || ''
    const type = searchParams.get('type') || 'ALL'

    // 필터 조건 구성
    const where: any = {
      companyId: admin.companyId
    }

    // 검색 조건
    if (search) {
      where.OR = [
        {
          employee: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          employee: {
            username: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }

    // 날짜 필터 (월별/일별 보기)
    if (month) {
      // 월별 보기: YYYY-MM 형식
      const startDate = new Date(month + '-01')
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)

      where.timestamp = {
        gte: startDate,
        lt: endDate
      }
    } else if (date) {
      // 일별 보기: YYYY-MM-DD 형식
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)

      where.timestamp = {
        gte: startDate,
        lt: endDate
      }
    }

    // 추가 날짜 필터 (선택사항)
    if (additionalDate) {
      const additionalStartDate = new Date(additionalDate)
      additionalStartDate.setHours(0, 0, 0, 0)
      const additionalEndDate = new Date(additionalStartDate)
      additionalEndDate.setDate(additionalEndDate.getDate() + 1)

      // 기존 날짜 필터가 있으면 AND 조건으로 추가
      if (where.timestamp) {
        where.AND = [
          { timestamp: where.timestamp },
          {
            timestamp: {
              gte: additionalStartDate,
              lt: additionalEndDate
            }
          }
        ]
        delete where.timestamp
      } else {
        where.timestamp = {
          gte: additionalStartDate,
          lt: additionalEndDate
        }
      }
    }

    // 타입 필터
    if (type !== 'ALL') {
      where.type = type
    }

    // 출퇴근 기록 조회
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            name: true,
            username: true,
            email: true,
            phone: true,
            customFields: true
          }
        },
        qrCode: {
          select: {
            name: true,
            location: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // 출퇴근 기록을 날짜별로 그룹화
    const grouped = new Map<string, any>()
    
    attendances.forEach(attendance => {
      const date = new Date(attendance.timestamp).toISOString().split('T')[0]
      const key = `${attendance.employee.id}-${date}`
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          employee: attendance.employee,
          date: date,
          checkIn: null,
          checkOut: null,
          totalHours: 0
        })
      }
      
      const summary = grouped.get(key)
      if (attendance.type === 'CHECK_IN') {
        summary.checkIn = attendance
      } else if (attendance.type === 'CHECK_OUT') {
        summary.checkOut = attendance
      }
      
      // 근무 시간 계산
      if (summary.checkIn && summary.checkOut) {
        const checkInTime = new Date(summary.checkIn.timestamp)
        const checkOutTime = new Date(summary.checkOut.timestamp)
        const diffMs = checkOutTime.getTime() - checkInTime.getTime()
        summary.totalHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10
      }
    })

    const summaries = Array.from(grouped.values()).sort((a, b) => {
      if (a.date !== b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return a.employee.name.localeCompare(b.employee.name)
    })

    // CSV 형식으로 데이터 변환 (한 줄로)
    const csvHeaders = [
      '직원명',
      '사용자명',
      '이메일',
      '전화번호',
      '날짜',
      '출근시간',
      '출근위치',
      '퇴근시간',
      '퇴근위치',
      '근무시간',
      '부서',
      '직급',
      '사번'
    ]

    const csvRows = summaries.map(summary => {
      const customFields = summary.employee.customFields ? JSON.parse(summary.employee.customFields) : {}
      
      return [
        summary.employee.name,
        summary.employee.username,
        summary.employee.email || '',
        summary.employee.phone || '',
        new Date(summary.date).toLocaleDateString('ko-KR'),
        summary.checkIn ? new Date(summary.checkIn.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '미기록',
        summary.checkIn ? (summary.checkIn.location || '') : '',
        summary.checkOut ? new Date(summary.checkOut.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '미기록',
        summary.checkOut ? (summary.checkOut.location || '') : '',
        summary.totalHours > 0 ? `${summary.totalHours}시간` : '',
        customFields.department || '',
        customFields.position || '',
        customFields.employeeId || ''
      ]
    })

    // CSV 데이터 생성
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n')

    // UTF-8 BOM 추가 (Excel에서 한글 깨짐 방지)
    const bom = '\uFEFF'
    const csvWithBom = bom + csvContent

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance_records_${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('출퇴근 기록 내보내기 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

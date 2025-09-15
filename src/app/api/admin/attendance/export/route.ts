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

    // 날짜 필터
    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)

      where.timestamp = {
        gte: startDate,
        lt: endDate
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
            phone: true
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

    // CSV 형식으로 데이터 변환
    const csvHeaders = [
      '직원명',
      '사용자명',
      '이메일',
      '전화번호',
      '타입',
      '시간',
      '위치',
      'QR코드명',
      'QR코드위치'
    ]

    const csvRows = attendances.map(attendance => [
      attendance.employee.name,
      attendance.employee.username,
      attendance.employee.email || '',
      attendance.employee.phone || '',
      attendance.type === 'CHECK_IN' ? '출근' : '퇴근',
      new Date(attendance.timestamp).toLocaleString('ko-KR'),
      attendance.location || '',
      attendance.qrCode?.name || '직접 기록',
      attendance.qrCode?.location || ''
    ])

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

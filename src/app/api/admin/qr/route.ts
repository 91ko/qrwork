import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'
import { getPrismaClient } from '@/lib/db-security'
import { setCorsHeaders, setSecurityHeaders } from '@/lib/security-middleware'

// Prisma 클라이언트 인스턴스 생성
const prisma = getPrismaClient()

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 })
  return setCorsHeaders(setSecurityHeaders(response), request)
}

// JWT 토큰에서 관리자 정보 추출
async function getAdminFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      console.log('토큰이 없습니다')
      return null
    }

    // 환경 변수에서 JWT 시크릿 가져오기 (fallback 포함)
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-for-production'
    
    const decoded = jwt.verify(token, jwtSecret) as any
    console.log('JWT 토큰 검증 성공:', { companyId: decoded.companyId, companyCode: decoded.companyCode })
    return decoded
  } catch (error) {
    console.error('JWT 토큰 검증 실패:', error)
    return null
  }
}

// QR 코드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const qrCodes = await prisma.qrCode.findMany({
      where: {
        companyId: admin.companyId
      },
      include: {
        _count: {
          select: {
            attendances: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // QR 코드 이미지 URL 생성
    const qrCodesWithImages = qrCodes.map(qr => ({
      ...qr,
      qrImageUrl: `/api/admin/qr/${qr.id}/image`
    }))

    const response = NextResponse.json({
      qrCodes: qrCodesWithImages
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('QR 코드 목록 조회 에러:', error)
    const errorResponse = NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
    return setCorsHeaders(setSecurityHeaders(errorResponse), request)
  }
}

// QR 코드 생성
export async function POST(request: NextRequest) {
  try {
    console.log('QR 코드 생성 API 시작')
    
    const admin = await getAdminFromToken(request)
    console.log('관리자 인증 결과:', admin ? '성공' : '실패')
    
    if (!admin) {
      const response = NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    const body = await request.json()
    console.log('요청 데이터:', body)
    const { name, type, location, latitude, longitude, radius, isActive } = body

    // 데이터베이스 연결 테스트
    console.log('데이터베이스 연결 테스트 중...')
    try {
      await prisma.$connect()
      console.log('데이터베이스 연결 성공')
    } catch (dbError) {
      console.error('데이터베이스 연결 실패:', dbError)
      const response = NextResponse.json(
        { message: '데이터베이스 연결에 실패했습니다.' },
        { status: 500 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // 유효성 검사
    if (!name || !type) {
      const response = NextResponse.json(
        { message: 'QR 코드 이름과 타입을 입력해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    if (type !== 'CHECK_IN' && type !== 'CHECK_OUT') {
      const response = NextResponse.json(
        { message: '올바른 QR 코드 타입을 선택해주세요.' },
        { status: 400 }
      )
      return setCorsHeaders(setSecurityHeaders(response), request)
    }

    // QR 코드 데이터 생성 (스캔 시 사용할 데이터)
    const qrData = {
      companyCode: admin.companyCode,
      qrCodeId: 'temp', // 임시 ID, 생성 후 업데이트
      type: type,
      name: name,
      location: location || null,
      scanUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://qrwork.vercel.app'}/company/${admin.companyCode}/scan`
    }

    // QR 코드 생성
    console.log('데이터베이스에 QR 코드 생성 시작')
    console.log('생성할 데이터:', {
      name,
      type,
      location: location || null,
      latitude: latitude || null,
      longitude: longitude || null,
      radius: radius || null,
      isActive: isActive !== undefined ? isActive : true,
      companyId: admin.companyId
    })
    
    const qrCode = await prisma.qrCode.create({
      data: {
        name: String(name),
        type: String(type),
        location: location ? String(location) : null,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        radius: radius ? Number(radius) : null,
        qrData: JSON.stringify(qrData),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        companyId: String(admin.companyId)
      }
    })
    console.log('QR 코드 생성 완료:', qrCode.id)

    // QR 코드 데이터 업데이트 (실제 ID 포함)
    const updatedQrData = {
      ...qrData,
      qrCodeId: qrCode.id
    }

    // QR 코드 데이터 업데이트
    console.log('QR 코드 데이터 업데이트 시작')
    await prisma.qrCode.update({
      where: { id: qrCode.id },
      data: {
        qrData: JSON.stringify(updatedQrData)
      }
    })
    console.log('QR 코드 데이터 업데이트 완료')

    // QR 코드 이미지 생성
    console.log('QR 코드 이미지 생성 시작')
    let qrImageDataURL = ''
    try {
      qrImageDataURL = await QRCode.toDataURL(JSON.stringify(updatedQrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      console.log('QR 코드 이미지 생성 완료')
    } catch (qrError) {
      console.error('QR 코드 이미지 생성 실패:', qrError)
      // 이미지 생성 실패해도 QR 코드는 생성된 상태로 응답
      qrImageDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }

    const response = NextResponse.json({
      message: 'QR 코드가 성공적으로 생성되었습니다.',
      qrCode: {
        id: qrCode.id,
        name: qrCode.name,
        type: qrCode.type,
        location: qrCode.location,
        latitude: qrCode.latitude,
        longitude: qrCode.longitude,
        radius: qrCode.radius,
        isActive: qrCode.isActive,
        qrData: JSON.stringify(updatedQrData),
        qrImageUrl: qrImageDataURL
      }
    })
    
    return setCorsHeaders(setSecurityHeaders(response), request)

  } catch (error) {
    console.error('QR 코드 생성 에러:', error)
    console.error('에러 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    const errorResponse = NextResponse.json(
      { 
        message: '서버 오류가 발생했습니다.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
    return setCorsHeaders(setSecurityHeaders(errorResponse), request)
  } finally {
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Prisma 연결 해제 에러:', disconnectError)
    }
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import QRCode from 'qrcode'

const prisma = new PrismaClient()

// JWT 토큰에서 관리자 정보 추출
async function getAdminFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    return decoded
  } catch (error) {
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      qrCodes: qrCodes
    })

  } catch (error) {
    console.error('QR 코드 목록 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// QR 코드 생성
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
    const { name, location } = body

    // 유효성 검사
    if (!name) {
      return NextResponse.json(
        { message: 'QR 코드 이름을 입력해주세요.' },
        { status: 400 }
      )
    }

    // QR 코드 생성
    const qrCode = await prisma.qrCode.create({
      data: {
        name,
        location: location || null,
        isActive: true,
        companyId: admin.companyId
      }
    })

    // QR 코드 데이터 생성 (스캔 시 사용할 데이터)
    const qrData = {
      companyCode: admin.companyCode,
      qrCodeId: qrCode.id,
      type: 'attendance'
    }

    // QR 코드 이미지 생성
    const qrImageDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return NextResponse.json({
      message: 'QR 코드가 성공적으로 생성되었습니다.',
      qrCode: qrCode,
      qrImageDataURL: qrImageDataURL,
      qrData: qrData
    })

  } catch (error) {
    console.error('QR 코드 생성 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

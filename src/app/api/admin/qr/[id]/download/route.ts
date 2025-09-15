import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import QRCode from 'qrcode'

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

export async function GET(
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

    // QR 코드가 해당 회사에 속하는지 확인
    const qrCode = await prisma.qrCode.findFirst({
      where: {
        id: id,
        companyId: admin.companyId
      }
    })

    if (!qrCode) {
      return NextResponse.json(
        { message: 'QR 코드를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // QR 코드 이미지 생성
    const qrImageBuffer = await QRCode.toBuffer(qrCode.qrData, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // PNG 이미지로 응답
    return new NextResponse(new Uint8Array(qrImageBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="QR_${qrCode.name}_${new Date().toISOString().split('T')[0]}.png"`
      }
    })

  } catch (error) {
    console.error('QR 코드 다운로드 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'
import QRCode from 'qrcode'

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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const params = await context.params
    const { id } = params

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

    // QR 코드 이미지 생성 (표시용)
    const qrImageBuffer = await QRCode.toBuffer(qrCode.qrData, {
      type: 'png',
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // PNG 이미지로 응답 (다운로드가 아닌 표시용)
    return new NextResponse(new Uint8Array(qrImageBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600' // 1시간 캐시
      }
    })

  } catch (error) {
    console.error('QR 코드 이미지 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

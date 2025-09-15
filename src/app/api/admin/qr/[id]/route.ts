import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

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

// QR 코드 삭제
export async function DELETE(
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

    // QR 코드 삭제 (관련 출퇴근 기록도 함께 삭제)
    await prisma.$transaction(async (tx) => {
      // 출퇴근 기록 삭제
      await tx.attendance.deleteMany({
        where: {
          qrCodeId: id
        }
      })

      // QR 코드 삭제
      await tx.qrCode.delete({
        where: {
          id: id
        }
      })
    })

    return NextResponse.json({
      message: 'QR 코드가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('QR 코드 삭제 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// QR 코드 정보 수정
export async function PUT(
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
    const body = await request.json()
    const { name, location, isActive } = body

    // QR 코드가 해당 회사에 속하는지 확인
    const existingQrCode = await prisma.qrCode.findFirst({
      where: {
        id: id,
        companyId: admin.companyId
      }
    })

    if (!existingQrCode) {
      return NextResponse.json(
        { message: 'QR 코드를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // QR 코드 정보 수정
    const updatedQrCode = await prisma.qrCode.update({
      where: { id: id },
      data: {
        name: name || existingQrCode.name,
        location: location || existingQrCode.location,
        isActive: isActive !== undefined ? isActive : existingQrCode.isActive
      }
    })

    return NextResponse.json({
      message: 'QR 코드 정보가 성공적으로 수정되었습니다.',
      qrCode: updatedQrCode
    })

  } catch (error) {
    console.error('QR 코드 수정 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

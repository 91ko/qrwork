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

// 회사 정보 업데이트
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminFromToken(request)
    
    if (!admin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, phone } = body

    // 유효성 검사
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { message: '회사명은 필수입니다.' },
        { status: 400 }
      )
    }

    // 회사 정보 업데이트
    const updatedCompany = await prisma.company.update({
      where: { id: admin.companyId },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null
      }
    })

    return NextResponse.json({
      message: '회사 정보가 성공적으로 업데이트되었습니다.',
      company: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        phone: updatedCompany.phone,
        code: updatedCompany.code,
        trialEndDate: updatedCompany.trialEndDate,
        isActive: updatedCompany.isActive
      }
    })

  } catch (error) {
    console.error('회사 정보 업데이트 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

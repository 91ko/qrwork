import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    // 관리자 정보 조회
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            trialEndDate: true,
            isActive: true
          }
        }
      }
    })

    if (!admin) {
      return NextResponse.json(
        { message: '존재하지 않는 관리자입니다.' },
        { status: 404 }
      )
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { message: '비활성화된 계정입니다.' },
        { status: 403 }
      )
    }

    if (!admin.company.isActive) {
      return NextResponse.json(
        { message: '비활성화된 회사입니다.' },
        { status: 403 }
      )
    }

    // 무료 체험 만료 확인
    if (new Date() > admin.company.trialEndDate) {
      return NextResponse.json(
        { message: '무료 체험이 만료되었습니다.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      company: admin.company
    })

  } catch (error) {
    console.error('로그인 상태 확인 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

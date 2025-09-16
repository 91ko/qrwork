import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// 회사 정보 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const params = await context.params
    const { code } = params

    const company = await prisma.company.findUnique({
      where: { code },
      select: {
        id: true,
        name: true,
        code: true,
        phone: true,
        trialEndDate: true,
        maxEmployees: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!company) {
      return NextResponse.json(
        { message: '회사를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ company })

  } catch (error) {
    console.error('회사 정보 조회 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

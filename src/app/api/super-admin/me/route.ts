import { NextRequest, NextResponse } from 'next/server'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

export async function GET(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email
      }
    })

  } catch (error) {
    console.error('최종 관리자 인증 확인 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

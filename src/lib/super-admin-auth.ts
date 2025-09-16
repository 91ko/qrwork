import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import prisma from '@/lib/prisma'

// JWT 토큰에서 최종 관리자 정보 추출
export async function getSuperAdminFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('superAdminToken')?.value
    
    if (!token) {
      return null
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET 환경 변수가 설정되지 않았습니다')
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
    
    if (decoded.role !== 'SUPER_ADMIN') {
      return null
    }

    // 최종 관리자 정보 조회
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.superAdminId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    })

    if (!superAdmin || !superAdmin.isActive) {
      return null
    }

    return superAdmin
  } catch (error) {
    console.error('최종 관리자 토큰 검증 실패:', error)
    return null
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSuperAdminFromToken } from '@/lib/super-admin-auth'

// 대량 작업 처리
export async function POST(request: NextRequest) {
  try {
    const superAdmin = await getSuperAdminFromToken(request)
    
    if (!superAdmin) {
      return NextResponse.json(
        { message: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { action, companyIds, data } = await request.json()

    if (!action || !companyIds || !Array.isArray(companyIds)) {
      return NextResponse.json(
        { message: '잘못된 요청입니다.' },
        { status: 400 }
      )
    }

    const results = []

    for (const companyId of companyIds) {
      try {
        let result = null

        switch (action) {
          case 'APPROVE':
            result = await prisma.company.update({
              where: { id: companyId },
              data: {
                isApproved: true,
                subscriptionStatus: 'ACTIVE',
                isActive: true
              }
            })
            break

          case 'REJECT':
            result = await prisma.company.update({
              where: { id: companyId },
              data: {
                isApproved: false,
                subscriptionStatus: 'REJECTED',
                isActive: false
              }
            })
            break

          case 'SUSPEND':
            result = await prisma.company.update({
              where: { id: companyId },
              data: {
                isActive: false,
                subscriptionStatus: 'SUSPENDED'
              }
            })
            break

          case 'ACTIVATE':
            result = await prisma.company.update({
              where: { id: companyId },
              data: {
                isActive: true,
                subscriptionStatus: 'ACTIVE'
              }
            })
            break

          case 'EXTEND_TRIAL':
            const extendDays = data?.extendDays || 7
            const currentTrialEnd = await prisma.company.findUnique({
              where: { id: companyId },
              select: { trialEndDate: true }
            })
            
            const newTrialEnd = new Date()
            if (currentTrialEnd?.trialEndDate) {
              newTrialEnd.setTime(currentTrialEnd.trialEndDate.getTime())
            }
            newTrialEnd.setDate(newTrialEnd.getDate() + extendDays)

            result = await prisma.company.update({
              where: { id: companyId },
              data: {
                trialEndDate: newTrialEnd,
                subscriptionStatus: 'TRIAL'
              }
            })
            break

          case 'UPDATE_SUBSCRIPTION':
            result = await prisma.company.update({
              where: { id: companyId },
              data: {
                subscriptionEndDate: data?.subscriptionEndDate ? new Date(data.subscriptionEndDate) : null,
                maxEmployees: data?.maxEmployees || undefined
              }
            })
            break

          default:
            throw new Error(`알 수 없는 작업: ${action}`)
        }

        results.push({
          companyId,
          status: 'SUCCESS',
          result
        })

      } catch (error) {
        console.error(`회사 ${companyId} 처리 중 오류:`, error)
        results.push({
          companyId,
          status: 'ERROR',
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
    }

    const successCount = results.filter(r => r.status === 'SUCCESS').length
    const errorCount = results.filter(r => r.status === 'ERROR').length

    return NextResponse.json({
      message: `대량 작업 완료: 성공 ${successCount}개, 실패 ${errorCount}개`,
      action,
      totalProcessed: companyIds.length,
      successCount,
      errorCount,
      results
    })

  } catch (error) {
    console.error('대량 작업 에러:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

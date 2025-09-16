import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'
import { logger } from '@/lib/logger'
import { errorHandlingMiddleware } from '@/lib/security-middleware'

// 문의 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!inquiry) {
      return NextResponse.json({ message: '문의를 찾을 수 없습니다.' }, { status: 404 })
    }

    return NextResponse.json({ inquiry })

  } catch (error) {
    logger.error('문의 상세 조회 에러', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return errorHandlingMiddleware(error, request)
  } finally {
    await prisma.$disconnect()
  }
}

// 문의 답변/상태 업데이트
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { response, status, priority } = body

    // 입력 검증
    if (response && (response.length < 5 || response.length > 2000)) {
      return NextResponse.json({ message: '답변은 5-2000자 사이로 입력해주세요.' }, { status: 400 })
    }

    // 입력 정화
    const sanitizedResponse = response ? sanitizeInput(response.trim()) : null

    // 문의 존재 확인
    const existingInquiry = await prisma.inquiry.findUnique({
      where: { id }
    })

    if (!existingInquiry) {
      return NextResponse.json({ message: '문의를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 업데이트 데이터 구성
    const updateData: any = {}
    if (sanitizedResponse) {
      updateData.response = sanitizedResponse
      updateData.respondedAt = new Date()
    }
    if (status) updateData.status = status
    if (priority) updateData.priority = priority

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        employee: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true
          }
        }
      }
    })

    logger.api('문의 업데이트', {
      inquiryId: id,
      status: inquiry.status,
      priority: inquiry.priority,
      hasResponse: !!inquiry.response
    })

    return NextResponse.json({
      message: '문의가 성공적으로 업데이트되었습니다.',
      inquiry
    })

  } catch (error) {
    logger.error('문의 업데이트 에러', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return errorHandlingMiddleware(error, request)
  } finally {
    await prisma.$disconnect()
  }
}

// 문의 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 문의 존재 확인
    const existingInquiry = await prisma.inquiry.findUnique({
      where: { id }
    })

    if (!existingInquiry) {
      return NextResponse.json({ message: '문의를 찾을 수 없습니다.' }, { status: 404 })
    }

    await prisma.inquiry.delete({
      where: { id }
    })

    logger.api('문의 삭제', {
      inquiryId: id,
      title: existingInquiry.title
    })

    return NextResponse.json({ message: '문의가 성공적으로 삭제되었습니다.' })

  } catch (error) {
    logger.error('문의 삭제 에러', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return errorHandlingMiddleware(error, request)
  } finally {
    await prisma.$disconnect()
  }
}

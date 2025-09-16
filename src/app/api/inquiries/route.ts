import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sanitizeInput } from '@/lib/security'
import { logger } from '@/lib/logger'
import { errorHandlingMiddleware } from '@/lib/security-middleware'

// 문의 목록 조회 (최종관리자용)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const priority = searchParams.get('priority') || ''

    const skip = (page - 1) * limit

    // 필터 조건 구성
    const where: any = {}
    if (status) where.status = status
    if (type) where.type = type
    if (priority) where.priority = priority

    const [inquiries, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.inquiry.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      inquiries,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })

  } catch (error) {
    logger.error('문의 목록 조회 에러', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return errorHandlingMiddleware(error, request)
  } finally {
    await prisma.$disconnect()
  }
}

// 문의 작성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type, priority, companyCode, adminId, employeeId } = body

    // 입력 검증
    if (!title || !content) {
      return NextResponse.json({ message: '제목과 내용을 입력해주세요.' }, { status: 400 })
    }

    // 입력 정화
    const sanitizedTitle = sanitizeInput(title.trim())
    const sanitizedContent = sanitizeInput(content.trim())

    if (sanitizedTitle.length < 2 || sanitizedTitle.length > 100) {
      return NextResponse.json({ message: '제목은 2-100자 사이로 입력해주세요.' }, { status: 400 })
    }

    if (sanitizedContent.length < 10 || sanitizedContent.length > 2000) {
      return NextResponse.json({ message: '내용은 10-2000자 사이로 입력해주세요.' }, { status: 400 })
    }

    // 회사 정보 조회 (companyCode가 있는 경우)
    let companyId = null
    if (companyCode) {
      const company = await prisma.company.findUnique({
        where: { code: companyCode },
        select: { id: true }
      })
      if (company) {
        companyId = company.id
      }
    }

    // 문의 생성
    const inquiry = await prisma.inquiry.create({
      data: {
        title: sanitizedTitle,
        content: sanitizedContent,
        type: type || 'GENERAL',
        priority: priority || 'MEDIUM',
        companyId,
        adminId: adminId || null,
        employeeId: employeeId || null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    logger.api('새 문의 생성', {
      inquiryId: inquiry.id,
      title: sanitizedTitle,
      type: inquiry.type,
      priority: inquiry.priority,
      companyId
    })

    return NextResponse.json({
      message: '문의가 성공적으로 등록되었습니다.',
      inquiry
    })

  } catch (error) {
    logger.error('문의 작성 에러', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return errorHandlingMiddleware(error, request)
  } finally {
    await prisma.$disconnect()
  }
}

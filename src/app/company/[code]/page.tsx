'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { QrCode, ArrowLeft, Users, Clock, BarChart3 } from 'lucide-react'

export default function CompanyPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">QR워크</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                메인으로
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <QrCode className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            QR워크에 오신 것을 환영합니다
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            회사 코드: <span className="font-mono font-bold text-blue-600">{companyCode}</span>
          </p>
          <p className="text-gray-500">
            출퇴근 관리와 직원 관리를 위한 QR 코드 시스템
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Employee Login */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">직원 출퇴근</h3>
            <p className="text-gray-600 mb-6">
              QR 코드를 스캔하여 출퇴근을 기록하세요
            </p>
            <Link
              href={`/company/${companyCode}/scan`}
              className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              <Clock className="h-5 w-5 mr-2" />
              출퇴근하기
            </Link>
          </div>

          {/* Admin Login */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center hover:shadow-lg transition-shadow">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">관리자 로그인</h3>
            <p className="text-gray-600 mb-6">
              직원 관리, 통계 확인, QR 코드 생성
            </p>
            <Link
              href={`/company/${companyCode}/admin`}
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              관리자 로그인
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">주요 기능</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR 코드 출퇴근</h3>
              <p className="text-gray-600 text-sm">
                간편한 QR 코드 스캔으로 정확한 출퇴근 기록
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">직원 관리</h3>
              <p className="text-gray-600 text-sm">
                직원 등록, 수정, 삭제 및 커스텀 필드 관리
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">통계 및 분석</h3>
              <p className="text-gray-600 text-sm">
                출퇴근 통계, 근무 시간 분석 및 리포트
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
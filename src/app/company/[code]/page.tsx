import { notFound } from 'next/navigation'
import { QrCode, Users, Clock, Shield, Phone } from 'lucide-react'
import Link from 'next/link'

interface CompanyPageProps {
  params: Promise<{
    code: string
  }>
}

// 회사 정보를 가져오는 함수
async function getCompany(code: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/company/${code}`, {
      cache: 'no-store' // 실시간 데이터를 위해 캐시 비활성화
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data.company
  } catch (error) {
    console.error('회사 정보 조회 에러:', error)
    return null
  }
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { code } = await params
  const company = await getCompany(code)
  
  if (!company) {
    notFound()
  }

  const trialEndDate = new Date(company.trialEndDate)
  const trialDaysLeft = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">QR워크</span>
              <span className="ml-4 text-lg text-gray-600">- {company.name}</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href={`/company/${code}/admin`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                관리자 로그인
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Company Info */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
            <div className="text-right">
              <p className="text-sm text-gray-500">회사 코드</p>
              <p className="text-lg font-mono font-bold text-blue-600">{company.code}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm text-gray-600">전화번호</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{company.phone}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm text-gray-600">무료 체험</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{trialDaysLeft}일 남음</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm text-gray-600">최대 직원 수</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{company.maxEmployees}명</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* QR 스캔 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">QR 스캔</h3>
              <p className="text-gray-600 mb-6">
                QR 코드를 스캔하여 출퇴근을 기록하세요
              </p>
              <Link
                href={`/company/${code}/scan`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
              >
                QR 스캔하기
              </Link>
            </div>
          </div>

          {/* 관리자 대시보드 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">관리자 대시보드</h3>
              <p className="text-gray-600 mb-6">
                직원 관리, QR 코드 생성, 출퇴근 현황을 확인하세요
              </p>
              <Link
                href={`/company/${code}/admin`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium inline-block"
              >
                관리자 로그인
              </Link>
            </div>
          </div>
        </div>

        {/* Trial Status */}
        {trialDaysLeft <= 7 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-800">무료 체험 만료 예정</h3>
            </div>
            <p className="text-yellow-700 mt-2">
              무료 체험이 {trialDaysLeft}일 후에 만료됩니다. 계속 사용하려면 유료 플랜으로 업그레이드하세요.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <QrCode className="h-6 w-6 text-blue-400" />
            <span className="ml-2 text-xl font-bold">QR워크</span>
          </div>
          <p className="text-gray-400">
            © 2024 QR워크. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

// 동적 라우팅을 위한 메타데이터 생성
export async function generateMetadata({ params }: CompanyPageProps) {
  const { code } = await params
  const company = await getCompany(code)
  
  if (!company) {
    return {
      title: '회사를 찾을 수 없습니다 - QR워크',
    }
  }

  return {
    title: `${company.name} - QR워크`,
    description: `${company.name}의 QR 코드 출퇴근 관리 시스템`,
  }
}

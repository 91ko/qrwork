import Link from 'next/link'
import { ArrowRight, QrCode, Users, Clock, TrendingUp } from 'lucide-react'

export default function HomePage() {
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
            <div className="flex space-x-4">
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                로그인
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                무료 체험 시작
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              QR 코드로
              <span className="text-blue-600"> 스마트한</span>
              <br />
              출퇴근 관리
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              QR워크는 QR 코드를 활용한 출퇴근 관리 시스템입니다. 
              회사별로 독립적인 환경을 제공하며, 14일 무료 체험으로 쉽게 시작할 수 있습니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium inline-flex items-center justify-center"
              >
                무료 체험 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="#features"
                className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium"
              >
                기능 알아보기
              </Link>
            </div>
          </div>
        </div>

        {/* Employee Login Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                직원 출퇴근
              </h2>
              <p className="text-xl text-gray-600">
                회사 코드를 입력하고 로그인하여 출퇴근을 기록하세요
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="max-w-md mx-auto">
                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target as HTMLFormElement)
                  const companyCode = formData.get('companyCode') as string
                  if (companyCode) {
                    window.location.href = `/company/${companyCode}/scan`
                  }
                }}>
                  <div>
                    <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700 mb-2">
                      회사 코드
                    </label>
                    <input
                      type="text"
                      id="companyCode"
                      name="companyCode"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="회사 코드를 입력하세요"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center"
                  >
                    <QrCode className="h-5 w-5 mr-2" />
                    출퇴근 페이지로 이동
                  </button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    회사 코드를 모르시나요? 관리자에게 문의하세요.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                주요 기능
              </h2>
              <p className="text-xl text-gray-600">
                QR워크의 강력한 기능들을 만나보세요
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">QR 코드 시스템</h3>
                <p className="text-gray-600">
                  간편한 QR 코드 스캔으로 출퇴근을 기록하고 관리합니다.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">직원 관리</h3>
                <p className="text-gray-600">
                  직원 정보를 체계적으로 관리하고 부서별로 구분합니다.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">실시간 관리</h3>
                <p className="text-gray-600">
                  실시간으로 출퇴근 현황을 모니터링하고 통계를 확인합니다.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">분석 및 통계</h3>
                <p className="text-gray-600">
                  출퇴근 패턴 분석과 상세한 통계 리포트를 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              지금 시작해보세요
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              14일 무료 체험으로 QR워크의 모든 기능을 경험해보세요
            </p>
            <Link
              href="/auth/register"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg text-lg font-medium inline-flex items-center justify-center"
            >
              무료 체험 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <QrCode className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-2xl font-bold">QR워크</span>
            </div>
            <p className="text-gray-400 mb-4">
              QR 코드를 활용한 스마트한 출퇴근 관리 시스템
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 QR워크. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

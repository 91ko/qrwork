import Link from 'next/link'
import { ArrowRight, QrCode, Users, Clock, TrendingUp } from 'lucide-react'
import Header from '@/components/Header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <Header />

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
              회사별로 독립적인 환경을 제공하며, 3개월 무료 체험으로 쉽게 시작할 수 있습니다.<br/>
              <span className="text-green-600 font-semibold">5인 미만은 평생무료!</span>
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

        {/* Demo Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                실제 사용 화면 미리보기
              </h2>
              <p className="text-xl text-gray-600">
                QR워크의 실제 사용 화면을 미리 확인해보세요
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Demo Images */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <div className="bg-blue-600 text-white p-3 rounded-lg mb-3">
                      <h3 className="font-semibold">관리자 대시보드</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-green-100 p-2 rounded text-sm">✅ 오늘 출근: 15명</div>
                      <div className="bg-red-100 p-2 rounded text-sm">❌ 오늘 퇴근: 8명</div>
                      <div className="bg-blue-100 p-2 rounded text-sm">📊 총 직원: 25명</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">실시간 출퇴근 현황을 한눈에 확인</p>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <div className="bg-green-600 text-white p-3 rounded-lg mb-3">
                      <h3 className="font-semibold">QR 코드 스캔</h3>
                    </div>
                    <div className="bg-black rounded-lg p-4 text-center">
                      <div className="border-2 border-white rounded-lg p-8 mb-2">
                        <div className="grid grid-cols-3 gap-1">
                          <div className="bg-white h-2 w-2"></div>
                          <div className="bg-white h-2 w-2"></div>
                          <div className="bg-white h-2 w-2"></div>
                          <div className="bg-white h-2 w-2"></div>
                          <div className="bg-white h-2 w-2"></div>
                          <div className="bg-white h-2 w-2"></div>
                          <div className="bg-white h-2 w-2"></div>
                          <div className="bg-white h-2 w-2"></div>
                          <div className="bg-white h-2 w-2"></div>
                        </div>
                      </div>
                      <p className="text-white text-sm">QR 코드를 카메라에 비춰주세요</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">간편한 카메라 스캔으로 출퇴근 기록</p>
                </div>
              </div>
              
              {/* Features List */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">주요 기능</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <QrCode className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">QR 코드 출퇴근</h4>
                        <p className="text-gray-600">스마트폰 카메라로 간편하게 출퇴근 기록</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-lg mr-4">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">직원 관리</h4>
                        <p className="text-gray-600">직원 정보 등록, 수정, 삭제 및 커스텀 필드 관리</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-purple-100 p-2 rounded-lg mr-4">
                        <Clock className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">실시간 모니터링</h4>
                        <p className="text-gray-600">출퇴근 현황을 실시간으로 확인하고 관리</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-orange-100 p-2 rounded-lg mr-4">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">통계 및 분석</h4>
                        <p className="text-gray-600">출퇴근 패턴 분석과 상세한 통계 리포트</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 사용 팁</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• QR 코드는 관리자가 생성하여 직원들에게 배포</li>
                    <li>• 5인 미만 회사는 평생무료로 이용 가능</li>
                    <li>• 커스텀 필드로 부서, 직급 등 추가 정보 관리</li>
                    <li>• 연차 관리 기능으로 휴가 신청 및 승인 처리</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                사용 방법
              </h2>
              <p className="text-xl text-gray-600">
                3단계로 간단하게 시작하는 QR워크
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">회사 등록</h3>
                <p className="text-gray-600">
                  회사 정보를 입력하고 관리자 계정을 생성합니다.<br/>
                  <span className="text-green-600 font-semibold">5인 미만은 평생무료!</span>
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">직원 등록 & QR 생성</h3>
                <p className="text-gray-600">
                  직원 정보를 등록하고 출퇴근용 QR 코드를 생성하여 배포합니다.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">출퇴근 관리</h3>
                <p className="text-gray-600">
                  직원들이 QR 코드를 스캔하여 출퇴근하고, 실시간으로 현황을 확인합니다.
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
              3개월 무료 체험으로 QR워크의 모든 기능을 경험해보세요<br/>
              <span className="text-green-600 font-semibold">5인 미만은 평생무료!</span>
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

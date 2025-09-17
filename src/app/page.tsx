import Link from 'next/link'
import { ArrowRight, QrCode, Users, Clock, TrendingUp, Calendar, User, BarChart3, FileText, Radio } from 'lucide-react'
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
              QR워크는 QR 코드와 Beacon을 활용한 출퇴근 관리 시스템입니다. 
              회사별로 독립적인 환경을 제공하며, 모든 기능을 완전 무료로 이용할 수 있습니다.<br/>
              <span className="text-green-600 font-semibold">🎉 모든 기능 완전 무료!</span><br/>
              <span className="text-blue-600 font-semibold">🔒 회사 거리 설정 가능 (기본 150미터)</span><br/>
              <span className="text-purple-600 font-semibold">📡 QR 코드 또는 Beacon 방식 선택 가능</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium inline-flex items-center justify-center"
              >
                무료로 시작하기
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
              <div className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">QR 코드 시스템</h3>
                <p className="text-gray-600">
                  간편한 QR 코드 스캔으로 출퇴근을 기록하고 관리합니다.<br/>
                  <span className="text-sm text-blue-600 font-medium">🔒 회사 거리 설정 가능 (기본 150미터)</span>
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radio className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Beacon 시스템</h3>
                <p className="text-gray-600">
                  자동 Beacon 감지로 무인 출퇴근을 기록하고 관리합니다.<br/>
                  <span className="text-sm text-purple-600 font-medium">📡 자동 감지로 편리한 출퇴근</span>
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
              
              <div className="text-center p-6">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">전자근로계약서</h3>
                <p className="text-gray-600">
                  디지털 근로계약서 작성, 전송, 승인을 온라인으로 처리합니다.
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
                      {/* 간단한 QR 코드 모양 */}
                      <div className="relative mx-auto w-32 h-32 bg-white rounded-lg p-3 mb-3">
                        {/* QR 코드 패턴 - 간단한 버전 */}
                        <div className="grid grid-cols-8 gap-1 h-full">
                          {Array.from({ length: 64 }, (_, i) => (
                            <div 
                              key={i}
                              className={`h-3 w-3 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'} rounded-sm`}
                            />
                          ))}
                        </div>
                        
                        {/* 스캔 라인 애니메이션 */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-green-400 animate-pulse"></div>
                        </div>
                      </div>
                      
                      <div className="text-white text-sm space-y-1">
                        <p className="font-semibold">📱 QR 코드를 카메라에 비춰주세요</p>
                        <p className="text-xs text-gray-300">자동으로 출퇴근이 기록됩니다</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* QR 스캔 과정 설명 */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">1</span>
                      </div>
                      <span>관리자가 생성한 QR 코드를 받습니다</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">2</span>
                      </div>
                      <span>설정된 거리 내에서 QR 코드를 스캔합니다</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-purple-100 p-1 rounded-full mr-3">
                        <span className="text-purple-600 font-bold text-xs">3</span>
                      </div>
                      <span>출근/퇴근 버튼을 눌러 기록을 완료합니다</span>
                    </div>
                    <div className="flex items-center text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                      <div className="bg-red-100 p-1 rounded-full mr-3">
                        <span className="text-red-600 font-bold text-xs">🔒</span>
                      </div>
                      <span className="font-medium">위치 기반 보안: 설정된 거리 내에서만 출퇴근 가능</span>
                    </div>
                  </div>
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
                        <p className="text-sm text-blue-600 font-medium">🔒 회사 거리 설정 가능 (기본 150미터)</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-purple-100 p-2 rounded-lg mr-4">
                        <Radio className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Beacon 자동 출퇴근</h4>
                        <p className="text-gray-600">Beacon 신호 자동 감지로 무인 출퇴근 기록</p>
                        <p className="text-sm text-purple-600 font-medium">📡 자동 감지로 편리한 출퇴근</p>
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
                    
                    <div className="flex items-start">
                      <div className="bg-red-100 p-2 rounded-lg mr-4">
                        <Calendar className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">연차 관리</h4>
                        <p className="text-gray-600">직원별 연차 부여 및 휴가 신청 승인 관리</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                        <User className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">커스텀 필드</h4>
                        <p className="text-gray-600">부서, 직급, 사번 등 회사별 맞춤 정보 관리</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-pink-100 p-2 rounded-lg mr-4">
                        <BarChart3 className="h-6 w-6 text-pink-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">출퇴근 기록 관리</h4>
                        <p className="text-gray-600">출퇴근 기록 수정, 삭제 및 상세 조회</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-lg mr-4">
                        <FileText className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">전자근로계약서</h4>
                        <p className="text-gray-600">표준 근로계약서 작성, 직원 전송, 디지털 서명 및 승인 관리</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 사용 팁</h4>
                  <ul className="text-blue-800 text-sm space-y-1">
                    <li>• QR 코드는 관리자가 생성하여 직원들에게 배포</li>
                    <li>• Beacon은 관리자가 설치하여 자동 출퇴근 설정</li>
                    <li>• 모든 기능을 완전 무료로 이용 가능</li>
                    <li>• 커스텀 필드로 부서, 직급 등 추가 정보 관리</li>
                    <li>• 연차 관리 기능으로 휴가 신청 및 승인 처리</li>
                    <li>• 전자근로계약서로 디지털 채용 프로세스 완성</li>
                    <li>• 🔒 위치 기반 보안: 회사 거리 설정 가능 (기본 150미터)</li>
                    <li>• 📡 QR 코드 또는 Beacon 방식 중 선택 가능</li>
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
                  <span className="text-green-600 font-semibold">모든 기능 완전 무료!</span>
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

        {/* Attendance Methods Section */}
        <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                출퇴근 방식 선택
              </h2>
              <p className="text-xl text-gray-600 mb-4">
                QR 코드와 Beacon 중에서 회사에 맞는 방식 선택
              </p>
              <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <span className="mr-2">🎯</span>
                관리자가 원하는 방식으로 설정 가능
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* QR Code Method */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">QR 코드 방식</h3>
                  <p className="text-gray-600">GPS 기반 위치 확인 + QR 코드 스캔</p>
                </div>
                
                {/* Visual Diagram */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">📍 GPS 기반 출퇴근 과정</h4>
                  </div>
                  
                  {/* GPS Location Visual */}
                  <div className="relative mb-4">
                    <div className="bg-blue-100 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">🏢</div>
                      <div className="text-sm font-medium text-blue-800">회사 위치</div>
                      <div className="text-xs text-blue-600">GPS 좌표 확인</div>
                    </div>
                    
                    {/* Distance Circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-32 h-32 border-2 border-dashed border-blue-400 rounded-full flex items-center justify-center">
                        <div className="text-xs text-blue-600 font-medium text-center">
                          <div>150m</div>
                          <div>반경</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* User Position */}
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-100 rounded-full p-2">
                        <div className="text-lg">👤</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Process Steps */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">1</span>
                      </div>
                      <span className="text-gray-700">GPS로 현재 위치 확인</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">2</span>
                      </div>
                      <span className="text-gray-700">회사 반경 내 위치인지 검증</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="bg-purple-100 p-1 rounded-full mr-3">
                        <span className="text-purple-600 font-bold text-xs">3</span>
                      </div>
                      <span className="text-gray-700">QR 코드 스캔으로 출퇴근 기록</span>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <span className="text-green-600 font-bold text-xs">✓</span>
                    </div>
                    <span>정확한 위치 기반 보안</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <span className="text-green-600 font-bold text-xs">✓</span>
                    </div>
                    <span>부정 출퇴근 완전 차단</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <span className="text-green-600 font-bold text-xs">✓</span>
                    </div>
                    <span>거리 설정 가능 (기본 150m)</span>
                  </div>
                </div>
              </div>
              
              {/* Beacon Method */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-6">
                  <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Radio className="h-10 w-10 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Beacon 방식</h3>
                  <p className="text-gray-600">자동 Beacon 신호 감지로 무인 출퇴근</p>
                </div>
                
                {/* Visual Diagram */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="text-center mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">📡 Beacon 자동 감지 과정</h4>
                  </div>
                  
                  {/* Beacon Visual */}
                  <div className="relative mb-4">
                    <div className="bg-purple-100 rounded-lg p-4 text-center">
                      <div className="text-2xl mb-2">📡</div>
                      <div className="text-sm font-medium text-purple-800">Beacon 장치</div>
                      <div className="text-xs text-purple-600">블루투스 신호 송신</div>
                    </div>
                    
                    {/* Signal Waves */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-24 h-24 border-2 border-purple-300 rounded-full animate-pulse"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-2 border-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                    </div>
                    
                    {/* User with Phone */}
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-100 rounded-full p-2">
                        <div className="text-lg">📱</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Process Steps */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="bg-purple-100 p-1 rounded-full mr-3">
                        <span className="text-purple-600 font-bold text-xs">1</span>
                      </div>
                      <span className="text-gray-700">Beacon 신호 자동 감지</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">2</span>
                      </div>
                      <span className="text-gray-700">신호 강도로 거리 측정</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">3</span>
                      </div>
                      <span className="text-gray-700">자동으로 출퇴근 기록</span>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <span className="text-green-600 font-bold text-xs">✓</span>
                    </div>
                    <span>완전 자동화된 출퇴근</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <span className="text-green-600 font-bold text-xs">✓</span>
                    </div>
                    <span>스마트폰 조작 불필요</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="bg-green-100 p-1 rounded-full mr-3">
                      <span className="text-green-600 font-bold text-xs">✓</span>
                    </div>
                    <span>Beacon 신호 강도로 거리 측정</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comparison Table */}
            <div className="mt-16 bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">방식별 비교</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">특징</th>
                      <th className="text-center py-4 px-6 font-semibold text-blue-600">QR 코드 방식</th>
                      <th className="text-center py-4 px-6 font-semibold text-purple-600">Beacon 방식</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">보안성</td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">매우 높음</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">높음</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">편의성</td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">보통</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">매우 높음</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">설치 비용</td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">무료</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">Beacon 장치 필요</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">정확도</td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">GPS 정확도</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">신호 강도 기반</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 font-medium text-gray-900">사용자 조작</td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">QR 스캔 필요</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">자동 감지</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Security Features Section */}
        <section className="py-20 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                강력한 보안 시스템
              </h2>
              <p className="text-xl text-gray-600 mb-4">
                위치 기반 출퇴근으로 부정 출퇴근을 완전 차단
              </p>
              <div className="inline-flex items-center bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
                <span className="mr-2">🔒</span>
                회사 거리 설정 가능 (기본 150미터)
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Security Features */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-100 p-3 rounded-lg mr-4">
                      <span className="text-red-600 font-bold text-2xl">📍</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">위치 기반 인증</h3>
                      <p className="text-gray-600">GPS를 활용한 정확한 위치 확인</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">✓</span>
                      </div>
                      <span>회사 주소 기준 설정된 거리 반경 내에서만 작동</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">✓</span>
                      </div>
                      <span>실시간 GPS 위치 확인으로 부정 출퇴근 방지</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">✓</span>
                      </div>
                      <span>위치 정보가 부정확하면 출퇴근 기록 불가</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <span className="text-blue-600 font-bold text-2xl">🛡️</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">부정 출퇴근 차단</h3>
                      <p className="text-gray-600">다양한 보안 기능으로 시스템 보호</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">1</span>
                      </div>
                      <span>QR 코드는 회사별로 고유하게 생성</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">2</span>
                      </div>
                      <span>위치 정보와 QR 코드 이중 검증</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">3</span>
                      </div>
                      <span>모든 출퇴근 기록에 위치 정보 저장</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Security Benefits */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">보안 효과</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-red-100 p-2 rounded-lg mr-4">
                        <span className="text-red-600 font-bold">🚫</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">부정 출퇴근 완전 차단</h4>
                        <p className="text-gray-600">집에서나 다른 장소에서의 가짜 출퇴근 기록 방지</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-lg mr-4">
                        <span className="text-green-600 font-bold">✅</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">정확한 근무 시간 관리</h4>
                        <p className="text-gray-600">실제 출퇴근 시간을 정확하게 기록하여 공정한 급여 계산</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <span className="text-blue-600 font-bold">📊</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">투명한 근무 관리</h4>
                        <p className="text-gray-600">모든 출퇴근 기록에 위치 정보가 포함되어 검증 가능</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-purple-100 p-2 rounded-lg mr-4">
                        <span className="text-purple-600 font-bold">⚖️</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">법적 근거 확보</h4>
                        <p className="text-gray-600">위치 정보가 포함된 출퇴근 기록으로 분쟁 시 증거 자료</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-6">
                  <h4 className="font-semibold text-red-900 mb-2">⚠️ 보안 경고</h4>
                  <ul className="text-red-800 text-sm space-y-1">
                    <li>• 설정된 거리 밖에서는 출퇴근 기록 불가</li>
                    <li>• GPS 위치 정보가 부정확하면 시스템 작동 안함</li>
                    <li>• 모든 출퇴근 기록은 위치 정보와 함께 저장</li>
                    <li>• 부정 출퇴근 시도는 자동으로 차단됨</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Electronic Contract Section */}
        <section className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                전자근로계약서 시스템
              </h2>
              <p className="text-xl text-gray-600 mb-4">
                디지털 채용 프로세스의 완성
              </p>
              <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <span className="mr-2">🎉</span>
                모든 기능 무료 제공
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Contract Process */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                      <FileText className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">근로계약서 작성</h3>
                      <p className="text-gray-600">표준 근로계약서 템플릿 제공</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">✓</span>
                      </div>
                      <span>근로조건 명시 (급여, 근무시간, 휴가 등)</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">✓</span>
                      </div>
                      <span>회사별 맞춤 조항 추가 가능</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-green-100 p-1 rounded-full mr-3">
                        <span className="text-green-600 font-bold text-xs">✓</span>
                      </div>
                      <span>법적 요구사항 자동 검증</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">직원 전송 및 승인</h3>
                      <p className="text-gray-600">디지털 서명 및 승인 프로세스</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">1</span>
                      </div>
                      <span>관리자가 근로계약서를 직원에게 전송</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">2</span>
                      </div>
                      <span>직원이 내용 검토 후 디지털 서명</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="bg-blue-100 p-1 rounded-full mr-3">
                        <span className="text-blue-600 font-bold text-xs">3</span>
                      </div>
                      <span>관리자 최종 승인으로 계약 완료</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Benefits */}
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">주요 장점</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-lg mr-4">
                        <span className="text-green-600 font-bold">⚡</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">빠른 처리</h4>
                        <p className="text-gray-600">종이 문서 없이 즉시 계약서 작성 및 승인</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-4">
                        <span className="text-blue-600 font-bold">🔒</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">보안성</h4>
                        <p className="text-gray-600">디지털 서명과 암호화로 안전한 계약 관리</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-purple-100 p-2 rounded-lg mr-4">
                        <span className="text-purple-600 font-bold">📊</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">추적 가능</h4>
                        <p className="text-gray-600">계약서 상태와 승인 과정을 실시간으로 추적</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="bg-orange-100 p-2 rounded-lg mr-4">
                        <span className="text-orange-600 font-bold">💾</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">자동 저장</h4>
                        <p className="text-gray-600">완료된 계약서 자동 저장 및 아카이브</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-indigo-50 rounded-lg p-6">
                  <h4 className="font-semibold text-indigo-900 mb-2">💼 비즈니스 가치</h4>
                  <ul className="text-indigo-800 text-sm space-y-1">
                    <li>• 채용 프로세스 시간 단축 (50% 이상)</li>
                    <li>• 종이 문서 비용 절약</li>
                    <li>• 법적 리스크 최소화</li>
                    <li>• 직원 온보딩 경험 향상</li>
                  </ul>
                </div>
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
              QR워크의 모든 기능을 완전 무료로 이용해보세요<br/>
              <span className="text-green-600 font-semibold">🎉 모든 기능 완전 무료!</span>
            </p>
            <Link
              href="/auth/register"
              className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-3 rounded-lg text-lg font-medium inline-flex items-center justify-center"
            >
              무료로 시작하기
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

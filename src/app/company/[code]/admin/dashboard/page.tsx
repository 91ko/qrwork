'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  Users, 
  Clock, 
  TrendingUp, 
  Settings, 
  LogOut,
  Plus,
  Eye,
  Download
} from 'lucide-react'

interface DashboardStats {
  totalEmployees: number
  activeEmployees: number
  todayAttendances: number
  qrCodes: number
}

interface RecentAttendance {
  id: string
  employeeName: string
  type: 'CHECK_IN' | 'CHECK_OUT'
  timestamp: string
}

interface AdminInfo {
  id: string
  name: string
  email: string
  role: string
}

interface CompanyInfo {
  id: string
  name: string
  code: string
  trialEndDate: string
  isActive: boolean
}

export default function AdminDashboard() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    todayAttendances: 0,
    qrCodes: 0
  })
  const [recentAttendances, setRecentAttendances] = useState<RecentAttendance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [companyCode, router])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAdmin(data.admin)
        setCompany(data.company)
        setIsAuthenticated(true)
        
        // 회사 코드가 일치하는지 확인
        if (data.company.code !== companyCode) {
          router.push(`/company/${data.company.code}/admin/dashboard`)
          return
        }
        
        // 대시보드 데이터 로드
        loadDashboardData()
      } else {
        // 로그인되지 않은 경우 로그인 페이지로 이동
        router.push(`/company/${companyCode}/admin`)
      }
    } catch (error) {
      console.error('인증 확인 에러:', error)
      router.push(`/company/${companyCode}/admin`)
    }
  }

  const loadDashboardData = async () => {
    try {
      // 통계 데이터 조회
      const statsResponse = await fetch('/api/admin/dashboard/stats', {
        method: 'GET',
        credentials: 'include'
      })

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // 최근 출퇴근 기록 조회
      const attendancesResponse = await fetch('/api/admin/dashboard/recent-attendances', {
        method: 'GET',
        credentials: 'include'
      })

      if (attendancesResponse.ok) {
        const attendancesData = await attendancesResponse.json()
        setRecentAttendances(attendancesData)
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('대시보드 데이터 로드 에러:', error)
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // 쿠키에서 토큰 제거
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      // 로그인 페이지로 이동
      router.push(`/company/${companyCode}/admin`)
    } catch (error) {
      console.error('로그아웃 에러:', error)
      window.location.href = `/company/${companyCode}`
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">QR워크</span>
              <span className="ml-4 text-lg text-gray-600">- 관리자 대시보드</span>
            </div>
            <div className="flex items-center space-x-4">
              {admin && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{admin.name}</span>님
                </div>
              )}
              <span className="text-sm text-gray-500">회사 코드: {companyCode}</span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 직원 수</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 직원</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeEmployees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오늘 출퇴근</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayAttendances}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <QrCode className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">QR 코드</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qrCodes}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h3>
              <div className="space-y-3">
                <Link
                  href={`/company/${companyCode}/admin/employees`}
                  className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Users className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-blue-900">직원 관리</span>
                </Link>
                
                <Link
                  href={`/company/${companyCode}/admin/qr`}
                  className="flex items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <QrCode className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-green-900">QR 코드 관리</span>
                </Link>
                
                <Link
                  href={`/company/${companyCode}/admin/attendance`}
                  className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Clock className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-purple-900">출퇴근 관리</span>
                </Link>
                
                <Link
                  href={`/company/${companyCode}/admin/settings`}
                  className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Settings className="h-5 w-5 text-gray-600 mr-3" />
                  <span className="text-gray-900">설정</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Attendances */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">최근 출퇴근 기록</h3>
                <Link
                  href={`/company/${companyCode}/admin/attendance`}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  전체 보기
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentAttendances.map((attendance) => (
                  <div key={attendance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        attendance.type === 'CHECK_IN' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{attendance.employeeName}</p>
                        <p className="text-sm text-gray-500">
                          {attendance.type === 'CHECK_IN' ? '출근' : '퇴근'} - {attendance.timestamp}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${
                      attendance.type === 'CHECK_IN' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {attendance.type === 'CHECK_IN' ? '출근' : '퇴근'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={`/company/${companyCode}/admin/employees/new`}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            직원 추가
          </Link>
          
          <Link
            href={`/company/${companyCode}/admin/qr/new`}
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR 코드 생성
          </Link>
          
          <button className="flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium">
            <Download className="h-4 w-4 mr-2" />
            데이터 내보내기
          </button>
        </div>
      </main>
    </div>
  )
}

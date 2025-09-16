'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  Clock, 
  Calendar,
  User,
  LogOut,
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react'

interface AttendanceRecord {
  id: string
  type: string
  timestamp: string
  location: string
  qrCode?: {
    name: string
    location: string
  }
}

interface Employee {
  id: string
  name: string
  username: string
  email: string
  phone: string
  company: {
    name: string
    code: string
  }
}

export default function EmployeeDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const loadAttendances = useCallback(async (date?: string) => {
    try {
      setIsLoading(true)
      const targetDate = date || selectedDate
      
      const response = await fetch(`/api/employee/attendance?date=${targetDate}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAttendances(data.attendances || [])
      } else {
        console.error('출퇴근 기록 조회 실패')
      }
    } catch (error) {
      console.error('출퇴근 기록 조회 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate])

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/employee/auth/me', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.employee.company.code === companyCode) {
          setIsAuthenticated(true)
          setEmployee(data.employee)
          loadAttendances()
        } else {
          router.push(`/company/${companyCode}/scan`)
        }
      } else {
        router.push(`/company/${companyCode}/scan`)
      }
    } catch (error) {
      console.error('인증 확인 에러:', error)
      router.push(`/company/${companyCode}/scan`)
    }
  }, [companyCode, router, loadAttendances])

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    loadAttendances(date)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/employee/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push(`/company/${companyCode}/scan`)
    } catch (error) {
      console.error('로그아웃 에러:', error)
    }
  }

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0]
    const todayAttendances = attendances.filter(a => 
      a.timestamp.startsWith(today)
    )
    
    const checkIn = todayAttendances.find(a => a.type === 'CHECK_IN')
    const checkOut = todayAttendances.find(a => a.type === 'CHECK_OUT')
    
    return { checkIn, checkOut, total: todayAttendances.length }
  }

  const getWeeklyStats = () => {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    
    return attendances.filter(a => {
      const date = new Date(a.timestamp)
      return date >= weekStart && date <= weekEnd
    }).length
  }

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !employee) {
    return null
  }

  const todayStats = getTodayStats()
  const weeklyStats = getWeeklyStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">QR워크</span>
              <span className="ml-4 text-lg text-gray-600">- 직원 대시보드</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">{employee.company.name}</span>
              <Link
                href={`/company/${companyCode}/scan`}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                출퇴근 페이지
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            안녕하세요, {employee.name}님!
          </h1>
          <p className="text-gray-600">개인 출퇴근 기록을 확인하세요</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">사용자명</p>
                <p className="text-lg font-bold text-gray-900">@{employee.username}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오늘 출근</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayStats.checkIn ? 
                    new Date(todayStats.checkIn.timestamp).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 
                    '미기록'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오늘 퇴근</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayStats.checkOut ? 
                    new Date(todayStats.checkOut.timestamp).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 
                    '미기록'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">이번 주 기록</p>
                <p className="text-2xl font-bold text-gray-900">{weeklyStats}회</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href={`/company/${companyCode}/scan`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <QrCode className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">QR 스캔</h3>
                <p className="text-gray-600">출퇴근 기록하기</p>
              </div>
            </div>
          </Link>

          <Link
            href={`/company/${companyCode}/employee/leave`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">연차 신청</h3>
                <p className="text-gray-600">휴가 신청 및 현황</p>
              </div>
            </div>
          </Link>

          <Link
            href={`/company/${companyCode}/employee/profile`}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">프로필 설정</h3>
                <p className="text-gray-600">개인정보 관리</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Date Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">출퇴근 기록</h2>
            <div className="flex items-center space-x-4">
              <label htmlFor="date" className="text-sm font-medium text-gray-700">
                날짜 선택:
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {attendances.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">출퇴근 기록이 없습니다</h3>
              <p className="text-gray-500">
                {selectedDate === new Date().toISOString().split('T')[0] 
                  ? '오늘은 아직 출퇴근 기록이 없습니다.' 
                  : '선택한 날짜에 출퇴근 기록이 없습니다.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      위치
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR 코드
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendances.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          attendance.type === 'CHECK_IN' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {attendance.type === 'CHECK_IN' ? '출근' : '퇴근'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(attendance.timestamp).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attendance.location || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attendance.qrCode ? (
                          <div>
                            <div className="text-sm text-gray-900">{attendance.qrCode.name}</div>
                            <div className="text-xs text-gray-500">{attendance.qrCode.location}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">직접 기록</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href={`/company/${companyCode}/scan`}
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg shadow-md transition-colors"
          >
            <div className="flex items-center">
              <QrCode className="h-8 w-8 mr-4" />
              <div>
                <h3 className="text-lg font-semibold">출퇴근 기록</h3>
                <p className="text-blue-100">QR 코드 스캔 또는 직접 기록</p>
              </div>
            </div>
          </Link>

          <Link
            href={`/company/${companyCode}/employee/profile`}
            className="bg-gray-600 hover:bg-gray-700 text-white p-6 rounded-lg shadow-md transition-colors"
          >
            <div className="flex items-center">
              <User className="h-8 w-8 mr-4" />
              <div>
                <h3 className="text-lg font-semibold">프로필 관리</h3>
                <p className="text-gray-100">개인 정보 및 설정 관리</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}

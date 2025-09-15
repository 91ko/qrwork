'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  LogIn, 
  Clock,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react'

export default function QrScanPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [employee, setEmployee] = useState<any>(null)
  const [lastAttendance, setLastAttendance] = useState<any>(null)

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
          setLastAttendance(data.lastAttendance)
        } else {
          // 다른 회사의 직원인 경우 해당 회사로 이동
          router.push(`/company/${data.employee.company.code}/scan`)
        }
      }
    } catch (error) {
      console.error('인증 확인 에러:', error)
    }
  }, [companyCode, router])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/employee/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          companyCode
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEmployee(data.employee)
        setLastAttendance(data.lastAttendance)
        setIsAuthenticated(true)
      } else {
        const data = await response.json()
        setError(data.message || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('로그인 에러:', error)
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttendance = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          companyCode
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setLastAttendance(data.attendance)
        // 성공 메시지 표시
        alert(type === 'CHECK_IN' ? '출근이 기록되었습니다!' : '퇴근이 기록되었습니다!')
      } else {
        const data = await response.json()
        setError(data.message || '출퇴근 기록에 실패했습니다.')
      }
    } catch (error) {
      console.error('출퇴근 기록 에러:', error)
      setError('출퇴근 기록 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'employee-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setIsAuthenticated(false)
    setEmployee(null)
    setLastAttendance(null)
    setFormData({ username: '', password: '' })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <QrCode className="h-12 w-12 text-blue-600" />
              <span className="ml-2 text-3xl font-bold text-gray-900">QR워크</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">직원 출퇴근</h2>
            <p className="mt-2 text-sm text-gray-600">
              회사 코드: <span className="font-mono font-bold text-blue-600">{companyCode}</span>
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 ID
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="사용자 ID를 입력하세요"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            {/* Back to Company Page */}
            <div className="mt-6 text-center">
              <Link
                href={`/company/${companyCode}`}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                ← 회사 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">QR워크</span>
              <span className="ml-4 text-lg text-gray-600">- 출퇴근</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">회사 코드: {companyCode}</span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            안녕하세요, {employee?.name}님!
          </h1>
          <p className="text-gray-600">출퇴근을 기록하세요</p>
        </div>

        {/* Last Attendance Status */}
        {lastAttendance && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">마지막 출퇴근 기록</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {lastAttendance.type === 'CHECK_IN' ? '출근' : '퇴근'} 시간
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {new Date(lastAttendance.timestamp).toLocaleString('ko-KR')}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                lastAttendance.type === 'CHECK_IN' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {lastAttendance.type === 'CHECK_IN' ? '출근' : '퇴근'}
              </div>
            </div>
          </div>
        )}

        {/* Attendance Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check In */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">출근</h3>
            <p className="text-gray-600 mb-6">출근 시간을 기록합니다</p>
            <button
              onClick={() => handleAttendance('CHECK_IN')}
              disabled={isLoading || (lastAttendance && lastAttendance.type === 'CHECK_IN')}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400"
            >
              {isLoading ? '처리 중...' : '출근하기'}
            </button>
          </div>

          {/* Check Out */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">퇴근</h3>
            <p className="text-gray-600 mb-6">퇴근 시간을 기록합니다</p>
            <button
              onClick={() => handleAttendance('CHECK_OUT')}
              disabled={isLoading || (lastAttendance && lastAttendance.type === 'CHECK_OUT')}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400"
            >
              {isLoading ? '처리 중...' : '퇴근하기'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">사용 방법</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 출근 시 "출근하기" 버튼을 클릭하세요</li>
            <li>• 퇴근 시 "퇴근하기" 버튼을 클릭하세요</li>
            <li>• 출근 후에는 퇴근만, 퇴근 후에는 출근만 가능합니다</li>
            <li>• 출퇴근 기록은 관리자 대시보드에서 확인할 수 있습니다</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
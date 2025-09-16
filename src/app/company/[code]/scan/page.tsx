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
  EyeOff,
  Camera,
  CheckCircle,
  XCircle
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
  const [rememberLogin, setRememberLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [employee, setEmployee] = useState<any>(null)
  const [lastAttendance, setLastAttendance] = useState<any>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [qrScanResult, setQrScanResult] = useState<string>('')
  const [isQrScanned, setIsQrScanned] = useState(false)
  const [scannedQrData, setScannedQrData] = useState<any>(null)
  const [nextAttendanceType, setNextAttendanceType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN')

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
    // 저장된 로그인 정보 불러오기
    const savedLogin = localStorage.getItem(`qrwork_login_${companyCode}`)
    if (savedLogin) {
      try {
        const loginData = JSON.parse(savedLogin)
        setFormData({
          username: loginData.username || '',
          password: loginData.password || ''
        })
        setRememberLogin(true)
      } catch (error) {
        console.error('저장된 로그인 정보 불러오기 실패:', error)
      }
    }
    
    checkAuthStatus()
  }, [checkAuthStatus, companyCode])

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
        
        // 로그인 정보 저장
        if (rememberLogin) {
          localStorage.setItem(`qrwork_login_${companyCode}`, JSON.stringify({
            username: formData.username,
            password: formData.password
          }))
        } else {
          localStorage.removeItem(`qrwork_login_${companyCode}`)
        }
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

  const handleQrScan = async (qrData: string) => {
    setIsLoading(true)
    setError('')

    try {
      // QR 데이터 파싱
      let parsedQrData
      try {
        parsedQrData = JSON.parse(qrData)
      } catch (error) {
        setError('잘못된 QR 코드입니다.')
        return
      }

      // QR 코드 유효성 검증 (간단한 검증)
      if (!parsedQrData.companyCode || !parsedQrData.qrCodeId) {
        setError('유효하지 않은 QR 코드입니다.')
        return
      }

      // 회사 코드 확인
      if (parsedQrData.companyCode !== companyCode) {
        setError('다른 회사의 QR 코드입니다.')
        return
      }

      // 다음 출퇴근 타입 결정
      const nextType = lastAttendance?.type === 'CHECK_IN' ? 'CHECK_OUT' : 'CHECK_IN'
      setNextAttendanceType(nextType)
      
      // QR 스캔 성공 처리
      setScannedQrData(parsedQrData)
      setIsQrScanned(true)
      setShowQrScanner(false)
      
      alert(`QR 코드가 인식되었습니다. ${nextType === 'CHECK_IN' ? '출근' : '퇴근'} 버튼을 눌러주세요.`)
      
    } catch (error) {
      console.error('QR 스캔 에러:', error)
      setError('QR 코드 스캔 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttendance = async () => {
    if (!scannedQrData) return
    
    setIsLoading(true)
    setError('')

    try {
      // GPS 위치 정보 가져오기
      let locationData = null
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000 // 5분
            })
          })
          
          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
        } catch (locationError) {
          console.warn('위치 정보를 가져올 수 없습니다:', locationError)
        }
      }

      const response = await fetch('/api/app/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(locationData && {
            'X-Latitude': locationData.latitude.toString(),
            'X-Longitude': locationData.longitude.toString(),
            'X-Accuracy': locationData.accuracy.toString()
          })
        },
        credentials: 'include',
        body: JSON.stringify({
          qrData: JSON.stringify(scannedQrData),
          username: employee.username,
          location: locationData
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setLastAttendance(data.attendance)
        setIsQrScanned(false)
        setScannedQrData(null)
        alert(`${data.attendance.type === 'CHECK_IN' ? '출근' : '퇴근'}이 기록되었습니다!`)
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

              {/* Remember Login */}
              <div className="flex items-center">
                <input
                  id="rememberLogin"
                  name="rememberLogin"
                  type="checkbox"
                  checked={rememberLogin}
                  onChange={(e) => setRememberLogin(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberLogin" className="ml-2 block text-sm text-gray-700">
                  로그인 정보 저장 (이 기기에서 자동 로그인)
                </label>
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

        {/* QR Code Scanner */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">QR 코드 스캔</h3>
            <p className="text-gray-600 mb-6">관리자가 생성한 QR 코드를 스캔하여 출퇴근하세요</p>
            
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500 mb-2">QR 코드 데이터를 입력하세요:</p>
              <textarea
                value={qrScanResult}
                onChange={(e) => setQrScanResult(e.target.value)}
                placeholder="QR 코드를 스캔하거나 데이터를 입력하세요..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
              />
              <button
                onClick={() => handleQrScan(qrScanResult)}
                disabled={!qrScanResult.trim() || isLoading}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:bg-gray-400"
              >
                {isLoading ? '처리 중...' : 'QR 코드 스캔'}
              </button>
            </div>
          </div>
        </div>

        {/* QR Scanned - Attendance Button */}
        {isQrScanned && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                nextAttendanceType === 'CHECK_IN' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <CheckCircle className={`h-8 w-8 ${
                  nextAttendanceType === 'CHECK_IN' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                QR 코드가 인식되었습니다!
              </h3>
              <p className="text-gray-600 mb-6">
                {nextAttendanceType === 'CHECK_IN' ? '출근' : '퇴근'} 버튼을 눌러 출퇴근을 기록하세요
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleAttendance}
                  disabled={isLoading}
                  className={`px-8 py-3 rounded-lg font-medium text-white ${
                    nextAttendanceType === 'CHECK_IN' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:bg-gray-400`}
                >
                  {isLoading ? '처리 중...' : `${nextAttendanceType === 'CHECK_IN' ? '출근' : '퇴근'}하기`}
                </button>
                <button
                  onClick={() => {
                    setIsQrScanned(false)
                    setScannedQrData(null)
                    setQrScanResult('')
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Buttons - Only show when QR is not scanned */}
        {!isQrScanned && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check In */}
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">출근</h3>
              <p className="text-gray-600 mb-6">QR 코드를 먼저 스캔해주세요</p>
              <button
                disabled={true}
                className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed"
              >
                QR 스캔 필요
              </button>
            </div>

            {/* Check Out */}
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">퇴근</h3>
              <p className="text-gray-600 mb-6">QR 코드를 먼저 스캔해주세요</p>
              <button
                disabled={true}
                className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed"
              >
                QR 스캔 필요
              </button>
            </div>
          </div>
        )}

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
            <li>• <strong>QR 코드 스캔:</strong> 관리자가 생성한 QR 코드를 스캔하여 자동 출퇴근</li>
            <li>• <strong>수동 출퇴근:</strong> "출근하기" 또는 "퇴근하기" 버튼 클릭</li>
            <li>• <strong>QR 코드 우선:</strong> QR 코드 스캔이 위치 정보와 함께 더 정확합니다</li>
            <li>• <strong>회사별 격리:</strong> 각 회사의 QR 코드는 해당 회사에서만 사용 가능</li>
            <li>• 출퇴근 기록은 관리자 대시보드에서 확인할 수 있습니다</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
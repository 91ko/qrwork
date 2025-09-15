'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  ArrowLeft, 
  Save,
  LogOut,
  Download,
  MapPin,
  Navigation,
  Settings
} from 'lucide-react'

interface LocationData {
  address: string
  latitude: number
  longitude: number
}

export default function NewQrCodePage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'CHECK_IN' as 'CHECK_IN' | 'CHECK_OUT',
    location: '',
    radius: 100,
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [generatedQr, setGeneratedQr] = useState<{
    id: string
    name: string
    type: string
    location: string
    latitude: number
    longitude: number
    radius: number
    qrData: string
    qrImageUrl: string
  } | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.company.code === companyCode) {
          setIsAuthenticated(true)
        } else {
          router.push(`/company/${data.company.code}/admin/qr/new`)
        }
      } else {
        router.push(`/company/${companyCode}/admin`)
      }
    } catch (error) {
      console.error('인증 확인 에러:', error)
      router.push(`/company/${companyCode}/admin`)
    }
  }, [companyCode, router])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked
    })
  }

  // 주소를 위도/경도로 변환하는 함수 (OpenStreetMap Nominatim 사용)
  const geocodeAddress = async (address: string): Promise<LocationData | null> => {
    try {
      // OpenStreetMap Nominatim API 사용 (무료)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=kr`)
      
      if (!response.ok) {
        throw new Error('지오코딩 실패')
      }

      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        return {
          address: result.display_name,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        }
      }
      
      return null
    } catch (error) {
      console.error('지오코딩 에러:', error)
      return null
    }
  }

  const handleLocationGeocode = async () => {
    if (!formData.location.trim()) {
      setError('주소를 입력해주세요.')
      return
    }

    setIsGeocoding(true)
    setError('')

    try {
      const locationData = await geocodeAddress(formData.location)
      
      if (locationData) {
        setFormData(prev => ({
          ...prev,
          location: locationData.address
        }))
        setError('')
      } else {
        setError('주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.')
      }
    } catch (error) {
      setError('주소 검색 중 오류가 발생했습니다.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 주소 지오코딩
      let locationData: LocationData | null = null
      if (formData.location.trim()) {
        locationData = await geocodeAddress(formData.location)
        if (!locationData) {
          setError('주소를 찾을 수 없습니다. 정확한 주소를 입력해주세요.')
          setIsLoading(false)
          return
        }
      }

      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          type: formData.type,
          location: locationData?.address || formData.location,
          latitude: locationData?.latitude,
          longitude: locationData?.longitude,
          radius: formData.radius,
          isActive: formData.isActive
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedQr(data.qrCode)
      } else {
        const data = await response.json()
        setError(data.message || 'QR 코드 생성에 실패했습니다.')
      }
    } catch (error) {
      setError('QR 코드 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedQr) return

    try {
      const response = await fetch(`/api/admin/qr/${generatedQr.id}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `QR_${generatedQr.name}_${generatedQr.type}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      setError('QR 코드 다운로드 중 오류가 발생했습니다.')
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
              <span className="ml-4 text-lg text-gray-600">- QR 코드 생성</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">회사 코드: {companyCode}</span>
              <Link
                href={`/company/${companyCode}/admin/qr`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                QR 목록
              </Link>
              <button
                onClick={() => {
                  document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
                  router.push(`/company/${companyCode}/admin`)
                }}
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* QR 코드 생성 폼 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">새 QR 코드 생성</h1>
              <p className="mt-2 text-gray-600">출퇴근용 QR 코드를 생성하세요</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    QR 코드 이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 본사 출근용 QR"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    QR 코드 타입 *
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CHECK_IN">출근용 QR</option>
                    <option value="CHECK_OUT">퇴근용 QR</option>
                  </select>
                </div>
              </div>

              {/* 위치 정보 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">위치 정보</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      주소
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 서울시 강남구 테헤란로 123"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleLocationGeocode}
                      disabled={isGeocoding}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                    >
                      {isGeocoding ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Navigation className="h-4 w-4 mr-2" />
                      )}
                      {isGeocoding ? '검색 중...' : '주소 검색'}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                    허용 반경 (미터)
                  </label>
                  <input
                    type="number"
                    id="radius"
                    name="radius"
                    min="10"
                    max="1000"
                    value={formData.radius}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    직원이 이 반경 내에서만 QR 코드를 스캔할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* QR 활성화 설정 */}
              <div className="space-y-4">
                <div className="flex items-center">
                  <Settings className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">QR 활성화 설정</h3>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    QR 코드 활성화 (체크 해제 시 QR 스캔 불가)
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  QR 코드를 생성한 후 언제든지 활성화/비활성화를 변경할 수 있습니다.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? '생성 중...' : 'QR 코드 생성'}
                </button>
              </div>
            </form>
          </div>

          {/* 생성된 QR 코드 */}
          {generatedQr && (
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">QR 코드 생성 완료!</h2>
                
                <div className="mb-6">
                  <img
                    src={generatedQr.qrImageUrl}
                    alt={`QR Code for ${generatedQr.name}`}
                    className="mx-auto border border-gray-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
                  <div>
                    <p className="text-sm font-medium text-gray-600">QR 코드 이름</p>
                    <p className="text-lg font-semibold text-gray-900">{generatedQr.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">타입</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {generatedQr.type === 'CHECK_IN' ? '출근용' : '퇴근용'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">위치</p>
                    <p className="text-lg font-semibold text-gray-900">{generatedQr.location || '위치 정보 없음'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">허용 반경</p>
                    <p className="text-lg font-semibold text-gray-900">{generatedQr.radius}m</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handleDownload}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    QR 코드 다운로드
                  </button>
                  <Link
                    href={`/company/${companyCode}/admin/qr`}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    QR 목록으로 이동
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
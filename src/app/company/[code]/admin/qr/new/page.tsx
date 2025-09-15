'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  ArrowLeft, 
  Save,
  LogOut,
  Download
} from 'lucide-react'

export default function NewQrCodePage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [generatedQr, setGeneratedQr] = useState<{
    id: string
    name: string
    location: string
    qrData: string
    qrImageUrl: string
  } | null>(null)

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedQr(data.qrCode)
      } else {
        const data = await response.json()
        setError(data.message || 'QR 코드 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('QR 코드 생성 에러:', error)
      setError('QR 코드 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadQr = async () => {
    if (!generatedQr) return

    try {
      const response = await fetch(`/api/admin/qr/${generatedQr.id}/download`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `QR_${generatedQr.name}_${new Date().toISOString().split('T')[0]}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('QR 코드 다운로드에 실패했습니다.')
      }
    } catch (error) {
      console.error('QR 코드 다운로드 에러:', error)
      alert('QR 코드 다운로드 중 오류가 발생했습니다.')
    }
  }

  if (!isAuthenticated) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR 생성 폼 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">새 QR 코드 생성</h1>
              <p className="mt-2 text-gray-600">출퇴근용 QR 코드를 생성하세요</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="예: 1층 출입구, 회의실 A"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  위치 정보 *
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 서울시 강남구 테헤란로 123, 1층 로비"
                />
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
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-gray-400"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isLoading ? '생성 중...' : 'QR 코드 생성'}
              </button>
            </form>
          </div>

          {/* QR 코드 미리보기 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">QR 코드 미리보기</h2>
            
            {generatedQr ? (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                  <img 
                    src={generatedQr.qrImageUrl} 
                    alt={`QR Code for ${generatedQr.name}`}
                    className="w-48 h-48"
                  />
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{generatedQr.name}</h3>
                  <p className="text-sm text-gray-600">{generatedQr.location}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleDownloadQr}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    QR 코드 다운로드
                  </button>
                  
                  <Link
                    href={`/company/${companyCode}/admin/qr`}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
                  >
                    QR 목록으로 이동
                  </Link>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">사용 방법</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. QR 코드를 인쇄하여 해당 위치에 부착하세요</li>
                    <li>2. 직원들이 QR 코드를 스캔하여 출퇴근을 기록합니다</li>
                    <li>3. 출퇴근 기록은 관리자 대시보드에서 확인할 수 있습니다</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">QR 코드를 생성하면 여기에 표시됩니다</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  ArrowLeft,
  LogOut,
  Download,
  Eye
} from 'lucide-react'

interface QrCodeItem {
  id: string
  name: string
  type: string
  location: string
  qrData: string
  isActive: boolean
  createdAt: string
  _count: {
    attendances: number
  }
}

export default function QrManagementPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [qrCodes, setQrCodes] = useState<QrCodeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
          loadQrCodes()
        } else {
          router.push(`/company/${data.company.code}/admin/qr`)
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

  const loadQrCodes = async () => {
    try {
      const response = await fetch('/api/admin/qr', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodes(data.qrCodes || [])
      }
    } catch (error) {
      console.error('QR 코드 목록 로드 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteQr = async (qrId: string) => {
    if (!confirm('정말로 이 QR 코드를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/qr/${qrId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // QR 코드 목록 새로고침
        loadQrCodes()
      } else {
        const data = await response.json()
        alert(data.message || 'QR 코드 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('QR 코드 삭제 에러:', error)
      alert('QR 코드 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDownloadQr = async (qrId: string, qrName: string) => {
    try {
      const response = await fetch(`/api/admin/qr/${qrId}/download`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `QR_${qrName}_${new Date().toISOString().split('T')[0]}.png`
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

  const filteredQrCodes = qrCodes.filter(qr =>
    qr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    qr.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <span className="ml-4 text-lg text-gray-600">- QR 코드 관리</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/company/${companyCode}/admin/dashboard`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                대시보드
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">QR 코드 관리</h1>
            <p className="mt-2 text-gray-600">출퇴근용 QR 코드를 생성하고 관리하세요</p>
          </div>
          <Link
            href={`/company/${companyCode}/admin/qr/new`}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            QR 코드 생성
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="QR 코드 이름, 위치로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* QR Codes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQrCodes.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-md p-12 text-center">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? '검색 결과가 없습니다.' : '등록된 QR 코드가 없습니다.'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? '다른 검색어를 시도해보세요.' : '새로운 QR 코드를 생성해보세요.'}
              </p>
              {!searchTerm && (
                <Link
                  href={`/company/${companyCode}/admin/qr/new`}
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  QR 코드 생성
                </Link>
              )}
            </div>
          ) : (
            filteredQrCodes.map((qr) => (
              <div key={qr.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <QrCode className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{qr.name}</h3>
                      <p className="text-sm text-gray-500">{qr.location}</p>
                      <div className="flex items-center mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          qr.type === 'CHECK_IN' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {qr.type === 'CHECK_IN' ? '📅 출근용' : '🏠 퇴근용'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${
                      qr.isActive ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      qr.isActive 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {qr.isActive ? '🟢 활성화 중' : '🔴 비활성화 중'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">사용 횟수</div>
                  <div className="text-2xl font-bold text-gray-900">{qr._count.attendances}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">생성일</div>
                  <div className="text-sm text-gray-900">
                    {new Date(qr.createdAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownloadQr(qr.id, qr.name)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    다운로드
                  </button>
                  <Link
                    href={`/company/${companyCode}/admin/qr/${qr.id}/edit`}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    수정
                  </Link>
                  <button
                    onClick={() => handleDeleteQr(qr.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <QrCode className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 QR 코드</p>
                <p className="text-2xl font-bold text-gray-900">{qrCodes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <QrCode className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 QR 코드</p>
                <p className="text-2xl font-bold text-gray-900">
                  {qrCodes.filter(qr => qr.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <QrCode className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 사용 횟수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {qrCodes.reduce((sum, qr) => sum + qr._count.attendances, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

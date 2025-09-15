'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  QrCode,
  ArrowLeft,
  Save,
  LogOut,
  Building,
  User,
  Shield,
  Calendar,
  Key
} from 'lucide-react'

interface CompanyInfo {
  id: string
  name: string
  phone: string
  code: string
  trialEndDate: string
  isActive: boolean
}

interface AdminInfo {
  id: string
  name: string
  email: string
  role: string
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string

  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [admin, setAdmin] = useState<AdminInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 회사 정보 수정 폼
  const [companyForm, setCompanyForm] = useState({
    name: '',
    phone: ''
  })

  // 관리자 비밀번호 변경 폼
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const checkAuthStatus = useCallback(async () => {
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

        if (data.company.code !== companyCode) {
          router.push(`/company/${data.company.code}/admin/settings`)
          return
        }

        // 폼 데이터 초기화
        setCompanyForm({
          name: data.company.name,
          phone: data.company.phone || ''
        })
      } else {
        router.push(`/company/${companyCode}/admin`)
      }
    } catch (error) {
      console.error('인증 확인 에러:', error)
      router.push(`/company/${companyCode}/admin`)
    } finally {
      setIsLoading(false)
    }
  }, [companyCode, router])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const handleCompanyFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyForm({
      ...companyForm,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    })
  }

  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/company/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(companyForm),
      })

      if (response.ok) {
        const data = await response.json()
        setCompany(data.company)
        setSuccess('회사 정보가 성공적으로 업데이트되었습니다.')
      } else {
        const data = await response.json()
        setError(data.message || '회사 정보 업데이트에 실패했습니다.')
      }
    } catch (error) {
      setError('회사 정보 업데이트 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    // 비밀번호 확인
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      setIsSaving(false)
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('새 비밀번호는 최소 6자 이상이어야 합니다.')
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch('/api/admin/password/change', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      })

      if (response.ok) {
        setSuccess('비밀번호가 성공적으로 변경되었습니다.')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        const data = await response.json()
        setError(data.message || '비밀번호 변경에 실패했습니다.')
      }
    } catch (error) {
      setError('비밀번호 변경 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push(`/company/${companyCode}/admin`)
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
              <span className="ml-4 text-lg text-gray-600">- 설정</span>
            </div>
            <div className="flex items-center space-x-4">
              {admin && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{admin.name}</span>님
                </div>
              )}
              <span className="text-sm text-gray-500">회사 코드: {companyCode}</span>
              <Link
                href={`/company/${companyCode}/admin/dashboard`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                대시보드
              </Link>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* 회사 정보 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <Building className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">회사 정보</h2>
            </div>

            <form onSubmit={handleCompanyUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    회사명 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={companyForm.name}
                    onChange={handleCompanyFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="회사명을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={companyForm.phone}
                    onChange={handleCompanyFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="02-1234-5678"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">회사 코드:</span> {company?.code}</p>
                  <p><span className="font-medium">무료 체험 종료일:</span> {company?.trialEndDate ? new Date(company.trialEndDate).toLocaleDateString('ko-KR') : 'N/A'}</p>
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? '저장 중...' : '회사 정보 저장'}
                </button>
              </div>
            </form>
          </div>

          {/* 관리자 계정 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">관리자 계정</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{admin?.name}</p>
                  <p className="text-sm text-gray-600">{admin?.email}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Key className="h-5 w-5 text-orange-600 mr-2" />
                비밀번호 변경
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호 *
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    required
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      새 비밀번호 *
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      required
                      value={passwordForm.newPassword}
                      onChange={handlePasswordFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="새 비밀번호를 입력하세요"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      새 비밀번호 확인 *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="새 비밀번호를 다시 입력하세요"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-400"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>
          </div>

          {/* 무료 체험 정보 */}
          {company && new Date() > new Date(company.trialEndDate) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900">무료 체험 만료</h3>
                  <p className="text-red-700">
                    무료 체험이 {new Date(company.trialEndDate).toLocaleDateString('ko-KR')}에 만료되었습니다.
                    계속 사용하려면 유료 플랜으로 업그레이드하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  ArrowLeft, 
  Save,
  LogOut,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react'

export default function NewEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [customFields, setCustomFields] = useState<Array<{
    id: string
    name: string
    value: string
    type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'ssn'
    options?: string[]
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAddField, setShowAddField] = useState(false)
  const [newField, setNewField] = useState({
    name: '',
    type: 'text' as 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'ssn',
    options: [] as string[]
  })

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
          router.push(`/company/${data.company.code}/admin/employees/new`)
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

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, value } : field
    ))
  }

  const addCustomField = () => {
    if (!newField.name.trim()) return

    const fieldId = `custom_${Date.now()}`
    setCustomFields(prev => [...prev, {
      id: fieldId,
      name: newField.name,
      value: '',
      type: newField.type,
      options: newField.type === 'select' ? newField.options : undefined
    }])

    setNewField({
      name: '',
      type: 'text',
      options: []
    })
    setShowAddField(false)
  }

  const removeCustomField = (fieldId: string) => {
    setCustomFields(prev => prev.filter(field => field.id !== fieldId))
  }

  const addSelectOption = () => {
    setNewField(prev => ({
      ...prev,
      options: [...prev.options, '']
    }))
  }

  const updateSelectOption = (index: number, value: string) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }))
  }

  const removeSelectOption = (index: number) => {
    setNewField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // 비밀번호 확인 검증
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      setIsLoading(false)
      return
    }

    // 비밀번호 길이 검증
    if (formData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          customFields: customFields.filter(field => field.value.trim() !== '')
        }),
      })

      if (response.ok) {
        // 성공 시 직원 목록으로 이동
        router.push(`/company/${companyCode}/admin/employees`)
      } else {
        const data = await response.json()
        setError(data.message || '직원 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('직원 등록 에러:', error)
      setError('직원 등록 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
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
              <span className="ml-4 text-lg text-gray-600">- 직원 등록</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/company/${companyCode}/admin/employees`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                직원 목록
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
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">새 직원 등록</h1>
            <p className="mt-2 text-gray-600">새로운 직원의 정보를 입력하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="홍길동"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="hong@company.com"
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
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  사용자 ID *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="employee001"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호를 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인 *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>
            </div>

            {/* 커스텀 필드 섹션 */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">추가 필드</h3>
                <button
                  type="button"
                  onClick={() => setShowAddField(!showAddField)}
                  className="flex items-center text-blue-600 hover:text-blue-500"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  필드 추가
                </button>
              </div>

              {/* 필드 추가 폼 */}
              {showAddField && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        필드 이름
                      </label>
                      <input
                        type="text"
                        value={newField.name}
                        onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 긴급연락처, 주소"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        필드 타입
                      </label>
                      <select
                        value={newField.type}
                        onChange={(e) => setNewField(prev => ({ 
                          ...prev, 
                          type: e.target.value as any,
                          options: e.target.value === 'select' ? [] : prev.options
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">텍스트</option>
                        <option value="email">이메일</option>
                        <option value="tel">전화번호</option>
                        <option value="ssn">주민번호</option>
                        <option value="select">선택박스</option>
                        <option value="textarea">긴 텍스트</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={addCustomField}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                      >
                        필드 추가
                      </button>
                    </div>
                  </div>

                  {/* 선택박스 옵션 설정 */}
                  {newField.type === 'select' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        선택 옵션
                      </label>
                      <div className="space-y-2">
                        {newField.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateSelectOption(index, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`옵션 ${index + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeSelectOption(index)}
                              className="text-red-600 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addSelectOption}
                          className="flex items-center text-blue-600 hover:text-blue-500 text-sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          옵션 추가
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 추가된 커스텀 필드들 */}
              {customFields.map((field) => (
                <div key={field.id} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.name}
                    </label>
                    <button
                      type="button"
                      onClick={() => removeCustomField(field.id)}
                      className="text-red-600 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {field.type === 'textarea' ? (
                    <textarea
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder={`${field.name}을 입력하세요`}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">선택하세요</option>
                      {field.options?.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'ssn' ? (
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        // 주민번호 포맷팅 (123456-1234567)
                        let value = e.target.value.replace(/[^0-9]/g, '')
                        if (value.length > 6) {
                          value = value.slice(0, 6) + '-' + value.slice(6, 13)
                        }
                        handleCustomFieldChange(field.id, value)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123456-1234567"
                      maxLength={14}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`${field.name}을 입력하세요`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Link
                href={`/company/${companyCode}/admin/employees`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-gray-400"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isLoading ? '등록 중...' : '직원 등록'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

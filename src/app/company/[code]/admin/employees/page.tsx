'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  ArrowLeft,
  LogOut,
  XCircle
} from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  username: string
  customFields: string
  isActive: boolean
  createdAt: string
}

export default function EmployeeManagementPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    isActive: true
  })
  const [customFields, setCustomFields] = useState<Array<{id: string, name: string, type: string, value: string, showInAttendance: boolean}>>([])
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

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
          loadEmployees()
        } else {
          router.push(`/company/${data.company.code}/admin/employees`)
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

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/admin/employees', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('직원 목록 로드 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('정말로 이 직원을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/employees/${employeeId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // 직원 목록 새로고침
        loadEmployees()
      } else {
        const data = await response.json()
        alert(data.message || '직원 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('직원 삭제 에러:', error)
      alert('직원 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setEditFormData({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      username: employee.username,
      password: '',
      confirmPassword: '',
      isActive: employee.isActive
    })
    
    // 커스텀 필드 파싱
    try {
      const parsedCustomFields = JSON.parse(employee.customFields || '{}')
      const fieldsArray = Object.entries(parsedCustomFields).map(([key, value]) => ({
        id: key,
        name: key,
        type: 'text',
        value: value as string,
        showInAttendance: true
      }))
      setCustomFields(fieldsArray)
    } catch {
      setCustomFields([])
    }
    
    setIsEditModalOpen(true)
    setEditError('')
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleEditCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields(prev => prev.map(field => 
      field.id === fieldId ? { ...field, value } : field
    ))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsEditLoading(true)
    setEditError('')

    // 비밀번호 확인
    if (editFormData.password && editFormData.password !== editFormData.confirmPassword) {
      setEditError('비밀번호가 일치하지 않습니다.')
      setIsEditLoading(false)
      return
    }

    try {
      const customFieldsData: { [key: string]: string } = {}
      customFields.forEach(field => {
        if (field.value.trim()) {
          customFieldsData[field.name] = field.value
        }
      })

      const response = await fetch(`/api/admin/employees/${editingEmployee?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          phone: editFormData.phone,
          username: editFormData.username,
          password: editFormData.password || undefined,
          customFields: customFieldsData,
          isActive: editFormData.isActive
        }),
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        loadEmployees()
      } else {
        const data = await response.json()
        setEditError(data.message || '직원 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('직원 수정 에러:', error)
      setEditError('직원 정보 수정 중 오류가 발생했습니다.')
    } finally {
      setIsEditLoading(false)
    }
  }

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.phone && employee.phone.toLowerCase().includes(searchTerm.toLowerCase()))
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
              <span className="ml-4 text-lg text-gray-600">- 직원 관리</span>
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
            <h1 className="text-3xl font-bold text-gray-900">직원 관리</h1>
            <p className="mt-2 text-gray-600">회사의 직원들을 관리하고 등록하세요</p>
          </div>
          <Link
            href={`/company/${companyCode}/admin/employees/new`}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            직원 추가
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="직원 이름, 이메일, 사번, 부서로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Employees Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    커스텀 필드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm ? '검색 결과가 없습니다.' : '등록된 직원이 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                          <div className="text-sm text-gray-500">{employee.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          try {
                            const customFields = JSON.parse(employee.customFields || '{}')
                            const fields = Object.entries(customFields).slice(0, 2)
                            return fields.length > 0 ? (
                              <div className="text-sm text-gray-900">
                                {fields.map(([key, value]) => (
                                  <div key={key}>{key}: {value as string}</div>
                                ))}
                                {Object.keys(customFields).length > 2 && (
                                  <div className="text-xs text-gray-500">+{Object.keys(customFields).length - 2}개 더</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">없음</div>
                            )
                          } catch {
                            return <div className="text-sm text-gray-500">없음</div>
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {employee.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditEmployee(employee)}
                            className="text-blue-600 hover:text-blue-900"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.id)}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 직원 수</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">활성 직원</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(emp => emp.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">비활성 직원</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employees.filter(emp => !emp.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 직원 수정 모달 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">직원 정보 수정</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      required
                      value={editFormData.name}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-2">
                      사용자명 *
                    </label>
                    <input
                      type="text"
                      id="edit-username"
                      name="username"
                      required
                      value={editFormData.username}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">
                      이메일
                    </label>
                    <input
                      type="email"
                      id="edit-email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-2">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      id="edit-phone"
                      name="phone"
                      value={editFormData.phone}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* 비밀번호 변경 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">비밀번호 변경 (선택사항)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-2">
                        새 비밀번호
                      </label>
                      <input
                        type="password"
                        id="edit-password"
                        name="password"
                        value={editFormData.password}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                        비밀번호 확인
                      </label>
                      <input
                        type="password"
                        id="edit-confirm-password"
                        name="confirmPassword"
                        value={editFormData.confirmPassword}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 커스텀 필드 */}
                {customFields.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">커스텀 필드</h3>
                    <div className="space-y-4">
                      {customFields.map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.name}
                          </label>
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => handleEditCustomFieldChange(field.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 활성 상태 */}
                <div className="border-t pt-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit-isActive"
                      name="isActive"
                      checked={editFormData.isActive}
                      onChange={handleEditInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit-isActive" className="ml-2 block text-sm text-gray-900">
                      계정 활성화
                    </label>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isEditLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {isEditLoading ? '수정 중...' : '수정 완료'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

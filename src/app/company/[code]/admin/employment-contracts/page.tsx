'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowLeft,
  Users,
  AlertTriangle
} from 'lucide-react'

interface EmploymentContract {
  id: string
  title: string
  content: string
  status: string
  sentAt: string | null
  signedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  createdAt: string
  employee: {
    id: string
    name: string
    email: string
  }
  createdBy: {
    id: string
    name: string
  }
}

interface Employee {
  id: string
  name: string
  email: string
  username: string
}

export default function EmploymentContractsPage() {
  const router = useRouter()
  const params = useParams()
  const companyCode = params.code as string

  const [contracts, setContracts] = useState<EmploymentContract[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingContract, setEditingContract] = useState<EmploymentContract | null>(null)
  const [formData, setFormData] = useState({
    employeeId: '',
    title: '',
    content: ''
  })
  const [isPaidFeature, setIsPaidFeature] = useState(false)

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setIsAuthenticated(true)
        
        // 5인 이상 회사인지 확인
        setIsPaidFeature(data.company.maxEmployees > 5)
        
        if (data.company.code !== companyCode) {
          router.push(`/company/${data.company.code}/admin/employment-contracts`)
          return
        }
        
        loadData()
      } else {
        router.push(`/company/${companyCode}/admin`)
      }
    } catch (error) {
      console.error('인증 확인 에러:', error)
      router.push(`/company/${companyCode}/admin`)
    }
  }, [companyCode, router])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // 근로계약서 목록 로드
      const contractsResponse = await fetch('/api/admin/employment-contracts', {
        credentials: 'include'
      })
      
      if (contractsResponse.ok) {
        const contractsData = await contractsResponse.json()
        setContracts(contractsData.contracts)
      }
      
      // 직원 목록 로드
      const employeesResponse = await fetch('/api/admin/employees', {
        credentials: 'include'
      })
      
      if (employeesResponse.ok) {
        const employeesData = await employeesResponse.json()
        setEmployees(employeesData.employees)
      }
    } catch (error) {
      console.error('데이터 로드 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const handleCreateContract = async () => {
    if (!formData.employeeId || !formData.title || !formData.content) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/admin/employment-contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('근로계약서가 생성되었습니다.')
        setShowCreateModal(false)
        setFormData({ employeeId: '', title: '', content: '' })
        loadData()
      } else {
        const data = await response.json()
        alert(data.message || '근로계약서 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('근로계약서 생성 에러:', error)
      alert('근로계약서 생성 중 오류가 발생했습니다.')
    }
  }

  const handleEditContract = async () => {
    if (!editingContract || !formData.title || !formData.content) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    try {
      const response = await fetch(`/api/admin/employment-contracts/${editingContract.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          content: formData.content
        })
      })

      if (response.ok) {
        alert('근로계약서가 수정되었습니다.')
        setShowEditModal(false)
        setEditingContract(null)
        setFormData({ employeeId: '', title: '', content: '' })
        loadData()
      } else {
        const data = await response.json()
        alert(data.message || '근로계약서 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('근로계약서 수정 에러:', error)
      alert('근로계약서 수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('정말로 이 근로계약서를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/employment-contracts/${contractId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('근로계약서가 삭제되었습니다.')
        loadData()
      } else {
        const data = await response.json()
        alert(data.message || '근로계약서 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('근로계약서 삭제 에러:', error)
      alert('근로계약서 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleSendContract = async (contractId: string) => {
    if (!confirm('이 근로계약서를 직원에게 전송하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/employment-contracts/${contractId}/send`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        alert('근로계약서가 전송되었습니다.')
        loadData()
      } else {
        const data = await response.json()
        alert(data.message || '근로계약서 전송에 실패했습니다.')
      }
    } catch (error) {
      console.error('근로계약서 전송 에러:', error)
      alert('근로계약서 전송 중 오류가 발생했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">초안</span>
      case 'SENT':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">전송됨</span>
      case 'SIGNED':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">서명됨</span>
      case 'REJECTED':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">거부됨</span>
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">알 수 없음</span>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Edit3 className="h-4 w-4" />
      case 'SENT':
        return <Send className="h-4 w-4" />
      case 'SIGNED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // 유료 기능 체크
  if (!isPaidFeature) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">유료 기능</h2>
            <p className="text-gray-600 mb-6">
              전자 근로계약서 기능은 6인 이상 회사에서만 사용할 수 있습니다.
            </p>
            <div className="space-y-4">
              <Link
                href="/contact?type=PAID_PLAN"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                유료 플랜 문의하기
              </Link>
              <div>
                <Link
                  href={`/company/${companyCode}/admin/dashboard`}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  관리자 대시보드로 돌아가기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href={`/company/${companyCode}/admin/dashboard`}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">전자 근로계약서 관리</h1>
                <p className="text-gray-600 mt-1">직원과의 근로계약서를 전자적으로 관리하세요</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 계약서 작성
            </button>
          </div>
        </div>

        {/* Contracts List */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">근로계약서 목록</h3>
          </div>
          
          {contracts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">등록된 근로계약서가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직원
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      생성일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{contract.employee.name}</div>
                          <div className="text-sm text-gray-500">{contract.employee.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{contract.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(contract.status)}
                          <span className="ml-2">{getStatusBadge(contract.status)}</span>
                        </div>
                        {contract.signedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            서명일: {new Date(contract.signedAt).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                        {contract.rejectedAt && (
                          <div className="text-xs text-red-500 mt-1">
                            거부일: {new Date(contract.rejectedAt).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(contract.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {contract.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingContract(contract)
                                  setFormData({
                                    employeeId: contract.employee.id,
                                    title: contract.title,
                                    content: contract.content
                                  })
                                  setShowEditModal(true)
                                }}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="수정"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSendContract(contract.id)}
                                className="text-green-600 hover:text-green-900"
                                title="전송"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteContract(contract.id)}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Contract Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">새 근로계약서 작성</h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setFormData({ employeeId: '', title: '', content: '' })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      직원 선택
                    </label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">직원을 선택하세요</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계약서 제목
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 정규직 근로계약서"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계약서 내용
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="근로계약서 내용을 입력하세요..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowCreateModal(false)
                        setFormData({ employeeId: '', title: '', content: '' })
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleCreateContract}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      생성
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Contract Modal */}
        {showEditModal && editingContract && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">근로계약서 수정</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingContract(null)
                      setFormData({ employeeId: '', title: '', content: '' })
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      직원
                    </label>
                    <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                      {editingContract.employee.name} ({editingContract.employee.email})
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계약서 제목
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      계약서 내용
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowEditModal(false)
                        setEditingContract(null)
                        setFormData({ employeeId: '', title: '', content: '' })
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleEditContract}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      수정
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

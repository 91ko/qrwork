'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  Calendar, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Eye,
  ArrowLeft,
  LogOut,
  Filter,
  Download
} from 'lucide-react'

interface LeaveRequest {
  id: string
  type: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: string
  adminNote: string
  createdAt: string
  employee: {
    id: string
    name: string
    username: string
  }
}

interface EmployeeLeave {
  id: string
  totalDays: number
  usedDays: number
  remainingDays: number
  year: number
  employee: {
    id: string
    name: string
    username: string
  }
}

export default function LeaveManagementPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [employeeLeaves, setEmployeeLeaves] = useState<EmployeeLeave[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<'requests' | 'leaves'>('requests')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [adminNote, setAdminNote] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')

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
          loadData()
        } else {
          router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('인증 확인 에러:', error)
      router.push('/auth/login')
    }
  }, [companyCode, router, loadData])

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      await Promise.all([
        loadLeaveRequests(),
        loadEmployeeLeaves()
      ])
    } catch (error) {
      console.error('데이터 로드 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }, [loadLeaveRequests, loadEmployeeLeaves])

  const loadLeaveRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/leave/requests?${params}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setLeaveRequests(data.requests)
      }
    } catch (error) {
      console.error('휴가 신청 조회 에러:', error)
    }
  }, [statusFilter])

  const loadEmployeeLeaves = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/leave/employees', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setEmployeeLeaves(data.leaves)
      }
    } catch (error) {
      console.error('직원 연차 조회 에러:', error)
    }
  }, [])

  const handleRequestAction = async () => {
    if (!selectedRequest) return

    try {
      const response = await fetch(`/api/admin/leave/requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: actionType === 'approve' ? 'APPROVED' : 'REJECTED',
          adminNote: adminNote
        }),
      })

      if (response.ok) {
        setIsModalOpen(false)
        setAdminNote('')
        loadLeaveRequests()
        loadEmployeeLeaves()
      } else {
        const data = await response.json()
        alert(data.message || '처리 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('휴가 신청 처리 에러:', error)
      alert('처리 중 오류가 발생했습니다.')
    }
  }

  const openActionModal = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(action)
    setAdminNote('')
    setIsModalOpen(true)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/auth/login')
    } catch (error) {
      console.error('로그아웃 에러:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return '대기중'
      case 'APPROVED': return '승인'
      case 'REJECTED': return '반려'
      default: return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'ANNUAL': return '연차'
      case 'SICK': return '병가'
      case 'PERSONAL': return '개인사유'
      case 'OTHER': return '기타'
      default: return type
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  useEffect(() => {
    if (isAuthenticated) {
      loadLeaveRequests()
    }
  }, [isAuthenticated, loadLeaveRequests])

  useEffect(() => {
    if (activeTab === 'requests') {
      loadLeaveRequests()
    }
  }, [statusFilter, activeTab])

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">QR워크</span>
              <span className="ml-4 text-lg text-gray-600">- 연차 관리</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">회사 코드: {companyCode}</span>
              <Link
                href={`/company/${companyCode}/admin/dashboard`}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                대시보드
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">연차 관리</h1>
          <p className="text-gray-600">직원들의 휴가 신청을 관리하고 연차 현황을 확인하세요</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                휴가 신청
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leaves'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                연차 현황
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'requests' ? (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">휴가 신청 목록</h2>
                <div className="flex items-center space-x-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="ALL">전체</option>
                    <option value="PENDING">대기중</option>
                    <option value="APPROVED">승인</option>
                    <option value="REJECTED">반려</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leave Requests Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        직원 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        휴가 유형
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        일수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          휴가 신청이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{request.employee.name}</div>
                              <div className="text-sm text-gray-500">@{request.employee.username}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTypeText(request.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div>{new Date(request.startDate).toLocaleDateString('ko-KR')}</div>
                              <div className="text-gray-500">~ {new Date(request.endDate).toLocaleDateString('ko-KR')}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.days}일
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                              {getStatusText(request.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {request.status === 'PENDING' ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => openActionModal(request, 'approve')}
                                  className="text-green-600 hover:text-green-900"
                                  title="승인"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => openActionModal(request, 'reject')}
                                  className="text-red-600 hover:text-red-900"
                                  title="반려"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400">처리완료</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Employee Leaves */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">직원 연차 현황 ({new Date().getFullYear()}년)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        직원 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총 연차
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용 연차
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        남은 연차
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용률
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employeeLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          연차 정보가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      employeeLeaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{leave.employee.name}</div>
                              <div className="text-sm text-gray-500">@{leave.employee.username}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {leave.totalDays}일
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {leave.usedDays}일
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`font-medium ${leave.remainingDays > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {leave.remainingDays}일
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    (leave.usedDays / leave.totalDays) > 0.8 ? 'bg-red-500' : 
                                    (leave.usedDays / leave.totalDays) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min((leave.usedDays / leave.totalDays) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {Math.round((leave.usedDays / leave.totalDays) * 100)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveRequests.filter(r => r.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveRequests.filter(r => r.status === 'APPROVED').length}
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
                <p className="text-sm font-medium text-gray-600">반려</p>
                <p className="text-2xl font-bold text-gray-900">
                  {leaveRequests.filter(r => r.status === 'REJECTED').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 연차</p>
                <p className="text-2xl font-bold text-gray-900">
                  {employeeLeaves.reduce((sum, leave) => sum + leave.totalDays, 0)}일
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {actionType === 'approve' ? '휴가 승인' : '휴가 반려'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">직원: {selectedRequest.employee.name}</p>
                <p className="text-sm text-gray-600 mb-2">기간: {new Date(selectedRequest.startDate).toLocaleDateString('ko-KR')} ~ {new Date(selectedRequest.endDate).toLocaleDateString('ko-KR')}</p>
                <p className="text-sm text-gray-600 mb-2">일수: {selectedRequest.days}일</p>
                {selectedRequest.reason && (
                  <p className="text-sm text-gray-600 mb-2">사유: {selectedRequest.reason}</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="adminNote" className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 메모
                </label>
                <textarea
                  id="adminNote"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={3}
                  placeholder="승인/반려 사유를 입력하세요"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  취소
                </button>
                <button
                  onClick={handleRequestAction}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                    actionType === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionType === 'approve' ? '승인' : '반려'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

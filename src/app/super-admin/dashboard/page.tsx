'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  LogOut,
  Search,
  Filter,
  Eye,
  Settings,
  X
} from 'lucide-react'

interface Company {
  id: string
  name: string
  code: string
  phone: string | null
  trialEndDate: string
  subscriptionStatus: string
  subscriptionEndDate: string | null
  isApproved: boolean
  isActive: boolean
  maxEmployees: number
  createdAt: string
  daysSinceCreated: number
  isTrialExpired: boolean
  isSubscriptionExpired: boolean
  totalAdmins: number
  totalEmployees: number
  totalAttendances: number
}

interface DashboardStats {
  totalCompanies: number
  approvedCompanies: number
  pendingCompanies: number
  expiredCompanies: number
  totalEmployees: number
  totalAttendances: number
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [showCompanyDetails, setShowCompanyDetails] = useState<string | null>(null)
  const [companyDetails, setCompanyDetails] = useState<any>(null)

  const loadDashboardData = useCallback(async (page = 1) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter
      })

      const response = await fetch(`/api/super-admin/companies?${params}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies)
        setTotalPages(data.totalPages)
        setCurrentPage(page)
        
        // 통계 계산
        const totalCompanies = data.total
        const approvedCompanies = data.companies.filter((c: Company) => c.isApproved).length
        const pendingCompanies = data.companies.filter((c: Company) => !c.isApproved).length
        const expiredCompanies = data.companies.filter((c: Company) => c.isTrialExpired && !c.isApproved).length
        const totalEmployees = data.companies.reduce((sum: number, c: Company) => sum + c.totalEmployees, 0)
        const totalAttendances = data.companies.reduce((sum: number, c: Company) => sum + c.totalAttendances, 0)

        setStats({
          totalCompanies,
          approvedCompanies,
          pendingCompanies,
          expiredCompanies,
          totalEmployees,
          totalAttendances
        })
      }
    } catch (error) {
      console.error('대시보드 데이터 로드 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, statusFilter])

  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/me', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        setIsAuthenticated(true)
        loadDashboardData()
      } else {
        router.push('/super-admin/login')
      }
    } catch (error) {
      console.error('인증 확인 에러:', error)
      router.push('/super-admin/login')
    }
  }, [router, loadDashboardData])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const handleApproveCompany = async (companyId: string, action: string) => {
    try {
      const response = await fetch(`/api/super-admin/companies/${companyId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        loadDashboardData(currentPage)
      } else {
        const data = await response.json()
        alert(data.message || '작업에 실패했습니다.')
      }
    } catch (error) {
      console.error('회사 승인 에러:', error)
      alert('작업 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`정말로 "${companyName}" 회사를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/super-admin/companies/${companyId}/delete`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`회사가 성공적으로 삭제되었습니다.\n\n삭제된 회사: ${data.deletedCompany.companyName}`)
        loadDashboardData(currentPage)
      } else {
        const data = await response.json()
        alert(data.message || '회사 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('회사 삭제 에러:', error)
      alert('회사 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleAutoApprove = async () => {
    if (!confirm('14일이 지난 회사들을 자동으로 만료 처리하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch('/api/super-admin/auto-approve', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        alert(`자동 처리 완료!\n\n처리된 회사 수: ${data.processedCount}개`)
        loadDashboardData(currentPage)
      } else {
        const data = await response.json()
        alert(data.message || '자동 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('자동 승인 에러:', error)
      alert('자동 처리 중 오류가 발생했습니다.')
    }
  }

  const handlePaymentApproval = async (companyId: string) => {
    const subscriptionEndDate = prompt('구독 종료일을 입력하세요 (YYYY-MM-DD 형식):')
    const maxEmployees = prompt('최대 직원 수를 입력하세요 (기본값: 10):')

    if (!subscriptionEndDate) {
      alert('구독 종료일을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/super-admin/auto-approve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          companyId,
          subscriptionEndDate,
          maxEmployees: maxEmployees ? parseInt(maxEmployees) : 10
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('입금 확인 후 승인 처리 완료!')
        loadDashboardData(currentPage)
      } else {
        const data = await response.json()
        alert(data.message || '승인 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('입금 승인 에러:', error)
      alert('승인 처리 중 오류가 발생했습니다.')
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedCompanies.length === 0) {
      alert('작업할 회사를 선택해주세요.')
      return
    }

    let confirmMessage = ''
    let data = null

    switch (action) {
      case 'APPROVE':
        confirmMessage = `선택한 ${selectedCompanies.length}개 회사를 승인하시겠습니까?`
        break
      case 'REJECT':
        confirmMessage = `선택한 ${selectedCompanies.length}개 회사를 거부하시겠습니까?`
        break
      case 'SUSPEND':
        confirmMessage = `선택한 ${selectedCompanies.length}개 회사를 정지하시겠습니까?`
        break
      case 'ACTIVATE':
        confirmMessage = `선택한 ${selectedCompanies.length}개 회사를 활성화하시겠습니까?`
        break
      case 'EXTEND_TRIAL':
        const extendDays = prompt('체험 기간을 몇 일 연장하시겠습니까? (기본값: 7일)')
        if (!extendDays) return
        confirmMessage = `선택한 ${selectedCompanies.length}개 회사의 체험 기간을 ${extendDays}일 연장하시겠습니까?`
        data = { extendDays: parseInt(extendDays) }
        break
    }

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch('/api/super-admin/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          action,
          companyIds: selectedCompanies,
          data
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`대량 작업 완료!\n성공: ${result.successCount}개\n실패: ${result.errorCount}개`)
        setSelectedCompanies([])
        loadDashboardData(currentPage)
      } else {
        const data = await response.json()
        alert(data.message || '대량 작업에 실패했습니다.')
      }
    } catch (error) {
      console.error('대량 작업 에러:', error)
      alert('대량 작업 중 오류가 발생했습니다.')
    }
  }

  const handleCompanySelect = (companyId: string, checked: boolean) => {
    if (checked) {
      setSelectedCompanies([...selectedCompanies, companyId])
    } else {
      setSelectedCompanies(selectedCompanies.filter(id => id !== companyId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCompanies(companies.map(company => company.id))
    } else {
      setSelectedCompanies([])
    }
  }

  const handleViewCompanyDetails = async (companyId: string) => {
    try {
      const response = await fetch(`/api/super-admin/companies/${companyId}/details`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCompanyDetails(data.company)
        setShowCompanyDetails(companyId)
      } else {
        alert('회사 상세 정보를 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('회사 상세 정보 조회 에러:', error)
      alert('회사 상세 정보 조회 중 오류가 발생했습니다.')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/super-admin/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/super-admin/login')
    } catch (error) {
      console.error('로그아웃 에러:', error)
    }
  }

  const getStatusBadge = (company: Company) => {
    if (!company.isApproved) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">승인 대기</span>
    }
    
    if (company.isTrialExpired && !company.subscriptionEndDate) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">체험 만료</span>
    }
    
    if (company.isSubscriptionExpired) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">구독 만료</span>
    }
    
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">활성</span>
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">최종 관리자 대시보드</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              <LogOut className="h-4 w-4 mr-2" />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 회사 수</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">승인된 회사</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedCompanies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">승인 대기</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingCompanies}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">만료된 회사</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.expiredCompanies}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Management Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">관리 작업</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">자동 처리</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleAutoApprove}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  14일 만료 처리
                </button>
                <button
                  onClick={() => loadDashboardData(1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  새로고침
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">대량 작업 ({selectedCompanies.length}개 선택됨)</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleBulkAction('APPROVE')}
                  disabled={selectedCompanies.length === 0}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  일괄 승인
                </button>
                <button
                  onClick={() => handleBulkAction('REJECT')}
                  disabled={selectedCompanies.length === 0}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  일괄 거부
                </button>
                <button
                  onClick={() => handleBulkAction('SUSPEND')}
                  disabled={selectedCompanies.length === 0}
                  className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  일괄 정지
                </button>
                <button
                  onClick={() => handleBulkAction('ACTIVATE')}
                  disabled={selectedCompanies.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  일괄 활성화
                </button>
                <button
                  onClick={() => handleBulkAction('EXTEND_TRIAL')}
                  disabled={selectedCompanies.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  체험 연장
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                검색
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="회사명, 코드, 전화번호"
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="ALL">전체</option>
                <option value="TRIAL">체험 중</option>
                <option value="ACTIVE">활성</option>
                <option value="EXPIRED">만료</option>
                <option value="SUSPENDED">정지</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => loadDashboardData(1)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center"
              >
                <Search className="h-4 w-4 mr-2" />
                검색
              </button>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedCompanies.length === companies.length && companies.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    회사 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    통계
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
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      등록된 회사가 없습니다.
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(company.id)}
                          onChange={(e) => handleCompanySelect(company.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">코드: {company.code}</div>
                          {company.phone && (
                            <div className="text-sm text-gray-500">전화: {company.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(company)}
                        <div className="text-xs text-gray-500 mt-1">
                          체험: {new Date(company.trialEndDate).toLocaleDateString('ko-KR')}
                        </div>
                        {company.subscriptionEndDate && (
                          <div className="text-xs text-gray-500">
                            구독: {new Date(company.subscriptionEndDate).toLocaleDateString('ko-KR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>관리자: {company.totalAdmins}명</div>
                        <div>직원: {company.totalEmployees}명</div>
                        <div>출퇴근: {company.totalAttendances}건</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(company.createdAt).toLocaleDateString('ko-KR')}
                        <div className="text-xs text-gray-400">
                          {company.daysSinceCreated}일 전
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => handleViewCompanyDetails(company.id)}
                            className="text-indigo-600 hover:text-indigo-900 text-xs bg-indigo-50 px-2 py-1 rounded"
                          >
                            상세
                          </button>
                          {!company.isApproved ? (
                            <>
                              <button
                                onClick={() => handleApproveCompany(company.id, 'APPROVE')}
                                className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded"
                              >
                                승인
                              </button>
                              <button
                                onClick={() => handlePaymentApproval(company.id)}
                                className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded"
                              >
                                입금승인
                              </button>
                              <button
                                onClick={() => handleApproveCompany(company.id, 'REJECT')}
                                className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded"
                              >
                                거부
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveCompany(company.id, 'SUSPEND')}
                                className="text-yellow-600 hover:text-yellow-900 text-xs bg-yellow-50 px-2 py-1 rounded"
                              >
                                정지
                              </button>
                              <button
                                onClick={() => handleApproveCompany(company.id, 'ACTIVATE')}
                                className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded"
                              >
                                활성화
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteCompany(company.id, company.name)}
                            className="text-red-600 hover:text-red-900 text-xs font-bold bg-red-50 px-2 py-1 rounded"
                          >
                            삭제
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex space-x-2">
              <button
                onClick={() => loadDashboardData(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => loadDashboardData(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => loadDashboardData(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </nav>
          </div>
        )}

        {/* Company Details Modal */}
        {showCompanyDetails && companyDetails && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {companyDetails.name} 상세 정보
                  </h3>
                  <button
                    onClick={() => {
                      setShowCompanyDetails(null)
                      setCompanyDetails(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 기본 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">기본 정보</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">회사명:</span> {companyDetails.name}</div>
                      <div><span className="font-medium">코드:</span> {companyDetails.code}</div>
                      <div><span className="font-medium">전화번호:</span> {companyDetails.phone || '미등록'}</div>
                      <div><span className="font-medium">등록일:</span> {new Date(companyDetails.createdAt).toLocaleDateString('ko-KR')}</div>
                      <div><span className="font-medium">상태:</span> {getStatusBadge(companyDetails)}</div>
                      <div><span className="font-medium">최대 직원 수:</span> {companyDetails.maxEmployees}명</div>
                    </div>
                  </div>

                  {/* 통계 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">통계 정보</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{companyDetails.statistics.totalAdmins}</div>
                        <div className="text-gray-600">관리자</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{companyDetails.statistics.totalEmployees}</div>
                        <div className="text-gray-600">직원</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{companyDetails.statistics.totalQrCodes}</div>
                        <div className="text-gray-600">QR코드</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{companyDetails.statistics.totalAttendances}</div>
                        <div className="text-gray-600">출퇴근 기록</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{companyDetails.statistics.thisMonthAttendances}</div>
                        <div className="text-gray-600">이번 달 출퇴근</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">{companyDetails.statistics.activeEmployees}</div>
                        <div className="text-gray-600">활성 직원</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 관리자 목록 */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">관리자 목록</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등록일</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {companyDetails.admins.map((admin: any) => (
                          <tr key={admin.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {admin.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {admin.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                admin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {admin.isActive ? '활성' : '비활성'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(admin.createdAt).toLocaleDateString('ko-KR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 최근 출퇴근 기록 */}
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">최근 출퇴근 기록</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">직원</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">위치</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {companyDetails.attendances.map((attendance: any) => (
                          <tr key={attendance.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {attendance.employee?.name || '알 수 없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                attendance.type === 'CHECK_IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {attendance.type === 'CHECK_IN' ? '출근' : '퇴근'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(attendance.timestamp).toLocaleString('ko-KR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {attendance.location || '미기록'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

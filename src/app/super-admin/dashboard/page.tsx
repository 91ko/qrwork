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
  Settings
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
  }, [router])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  const loadDashboardData = async (page = 1) => {
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
  }

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
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      등록된 회사가 없습니다.
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
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
                        <div className="flex space-x-2">
                          {!company.isApproved ? (
                            <>
                              <button
                                onClick={() => handleApproveCompany(company.id, 'APPROVE')}
                                className="text-green-600 hover:text-green-900"
                              >
                                승인
                              </button>
                              <button
                                onClick={() => handleApproveCompany(company.id, 'REJECT')}
                                className="text-red-600 hover:text-red-900"
                              >
                                거부
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveCompany(company.id, 'SUSPEND')}
                                className="text-yellow-600 hover:text-yellow-900"
                              >
                                정지
                              </button>
                              <button
                                onClick={() => handleApproveCompany(company.id, 'ACTIVATE')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                활성화
                              </button>
                            </>
                          )}
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
      </main>
    </div>
  )
}

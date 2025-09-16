'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  QrCode, 
  Clock, 
  Users, 
  Calendar,
  Search,
  Filter,
  Download,
  ArrowLeft,
  LogOut,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Edit3
} from 'lucide-react'

interface AttendanceRecord {
  id: string
  type: string
  timestamp: string
  location: string
  employee: {
    id: string
    name: string
    username: string
    phone?: string
    customFields?: string
  }
  qrCode?: {
    name: string
    location: string
  }
}

interface AttendanceSummary {
  employee: {
    id: string
    name: string
    username: string
    phone?: string
    customFields?: string
  }
  date: string
  checkIn?: AttendanceRecord
  checkOut?: AttendanceRecord
  totalHours?: number
}

export default function AttendanceRecordsPage() {
  const params = useParams()
  const router = useRouter()
  const companyCode = params.code as string
  
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([])
  const [attendanceSummaries, setAttendanceSummaries] = useState<AttendanceSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM 형식
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]) // YYYY-MM-DD 형식
  const [showCustomFields, setShowCustomFields] = useState<string[]>([]) // 표시할 커스텀 필드들
  const [availableCustomFields, setAvailableCustomFields] = useState<string[]>([]) // 사용 가능한 커스텀 필드들
  const [showEditModal, setShowEditModal] = useState(false) // 수정 모달 표시 여부
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null) // 수정 중인 출퇴근 기록
  const [editForm, setEditForm] = useState({
    timestamp: '',
    type: 'CHECK_IN',
    location: ''
  })
  const itemsPerPage = 20

  // 출퇴근 기록을 날짜별로 그룹화하는 함수
  const groupAttendancesByDate = (attendances: AttendanceRecord[]): AttendanceSummary[] => {
    const grouped = new Map<string, AttendanceSummary>()

    attendances.forEach(attendance => {
      const date = new Date(attendance.timestamp).toISOString().split('T')[0]
      const key = `${attendance.employee.id}-${date}`

      if (!grouped.has(key)) {
        grouped.set(key, {
          employee: attendance.employee,
          date: date,
          checkIn: undefined,
          checkOut: undefined,
          totalHours: 0
        })
      }

      const summary = grouped.get(key)!
      if (attendance.type === 'CHECK_IN') {
        summary.checkIn = attendance
      } else if (attendance.type === 'CHECK_OUT') {
        summary.checkOut = attendance
      }

      // 근무 시간 계산
      if (summary.checkIn && summary.checkOut) {
        const checkInTime = new Date(summary.checkIn.timestamp)
        const checkOutTime = new Date(summary.checkOut.timestamp)
        const diffMs = checkOutTime.getTime() - checkInTime.getTime()
        summary.totalHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10 // 소수점 1자리
      }
    })

    return Array.from(grouped.values()).sort((a, b) => {
      // 날짜 내림차순, 직원명 오름차순
      if (a.date !== b.date) {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
      return a.employee.name.localeCompare(b.employee.name)
    })
  }

  const loadAttendances = useCallback(async (page = 1) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter !== 'ALL') params.append('type', typeFilter)
      
      // 월별/일별 보기에 따른 날짜 필터 설정
      if (viewMode === 'monthly') {
        params.append('month', selectedMonth)
      } else if (viewMode === 'daily') {
        params.append('date', selectedDate)
      }
      
      // 추가 날짜 필터가 있으면 적용
      if (dateFilter) params.append('additionalDate', dateFilter)

      const response = await fetch(`/api/admin/attendance?${params}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAttendances(data.attendances)
        // 출퇴근 기록을 날짜별로 그룹화
        const summaries = groupAttendancesByDate(data.attendances)
        setAttendanceSummaries(summaries)
        setTotalPages(Math.ceil(data.total / itemsPerPage))
        setCurrentPage(page)
        
        // 사용 가능한 커스텀 필드들 추출
        const customFieldsSet = new Set<string>()
        data.attendances.forEach((attendance: AttendanceRecord) => {
          if (attendance.employee.customFields) {
            try {
              const customFields = JSON.parse(attendance.employee.customFields)
              Object.keys(customFields).forEach(key => {
                if (customFields[key] && customFields[key].trim() !== '') {
                  customFieldsSet.add(key)
                }
              })
            } catch (error) {
              console.warn('커스텀 필드 파싱 에러:', error)
            }
          }
        })
        
        // 기본 필드들도 추가
        const allAvailableFields = [
          'department', 'position', 'employeeId', 'phone',
          ...Array.from(customFieldsSet)
        ]
        setAvailableCustomFields(allAvailableFields)
      } else {
        console.error('출퇴근 기록 조회 실패')
      }
    } catch (error) {
      console.error('출퇴근 기록 조회 에러:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm, dateFilter, typeFilter, itemsPerPage, viewMode, selectedMonth, selectedDate])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    loadAttendances(1)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter !== 'ALL') params.append('type', typeFilter)
      
      // 월별/일별 보기에 따른 날짜 필터 설정
      if (viewMode === 'monthly') {
        params.append('month', selectedMonth)
      } else if (viewMode === 'daily') {
        params.append('date', selectedDate)
      }
      
      // 추가 날짜 필터가 있으면 적용
      if (dateFilter) params.append('additionalDate', dateFilter)

      const response = await fetch(`/api/admin/attendance/export?${params}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const filename = viewMode === 'monthly' 
          ? `attendance_records_${selectedMonth}.csv`
          : `attendance_records_${selectedDate}.csv`
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('출퇴근 기록 내보내기 에러:', error)
    }
  }

  const handleDeleteAttendance = async (attendanceId: string, employeeName: string, type: string) => {
    if (!confirm(`정말로 ${employeeName}님의 ${type === 'CHECK_IN' ? '출근' : '퇴근'} 기록을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/attendance/${attendanceId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('출퇴근 기록이 성공적으로 삭제되었습니다.')
        // 현재 페이지 다시 로드
        loadAttendances(currentPage)
      } else {
        const data = await response.json()
        alert(data.message || '출퇴근 기록 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('출퇴근 기록 삭제 에러:', error)
      alert('출퇴근 기록 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleEditAttendance = (attendance: AttendanceRecord) => {
    setEditingAttendance(attendance)
    setEditForm({
      timestamp: new Date(attendance.timestamp).toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM 형식
      type: attendance.type,
      location: attendance.location || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateAttendance = async () => {
    if (!editingAttendance) return

    try {
      const response = await fetch(`/api/admin/attendance/${editingAttendance.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        alert('출퇴근 기록이 성공적으로 수정되었습니다.')
        setShowEditModal(false)
        setEditingAttendance(null)
        // 현재 페이지 다시 로드
        loadAttendances(currentPage)
      } else {
        const data = await response.json()
        alert(data.message || '출퇴근 기록 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('출퇴근 기록 수정 에러:', error)
      alert('출퇴근 기록 수정 중 오류가 발생했습니다.')
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingAttendance(null)
    setEditForm({
      timestamp: '',
      type: 'CHECK_IN',
      location: ''
    })
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
          loadAttendances()
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
  }, [companyCode, router, loadAttendances])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  // 뷰 모드나 날짜가 변경될 때 데이터 다시 로드
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentPage(1)
      loadAttendances(1)
    }
  }, [viewMode, selectedMonth, selectedDate, isAuthenticated, loadAttendances])

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
              <span className="ml-4 text-lg text-gray-600">- 출퇴근 기록</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">출퇴근 기록</h1>
          <p className="text-gray-600">직원들의 출퇴근 기록을 조회하고 관리하세요</p>
        </div>

        {/* View Mode Selection */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">보기 모드</h2>
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'monthly'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  월별 보기
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('daily')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'daily'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  일별 보기
                </button>
              </div>
              
              {viewMode === 'monthly' && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="month" className="text-sm font-medium text-gray-700">
                    월 선택:
                  </label>
                  <input
                    type="month"
                    id="month"
                    value={selectedMonth}
                    onChange={(e) => {
                      setSelectedMonth(e.target.value)
                      setDateFilter('') // 월별 보기일 때는 날짜 필터 초기화
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              )}
              
              {viewMode === 'daily' && (
                <div className="flex items-center space-x-2">
                  <label htmlFor="date" className="text-sm font-medium text-gray-700">
                    날짜 선택:
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value)
                      setDateFilter(e.target.value) // 일별 보기일 때는 날짜 필터에 설정
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Custom Fields Settings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">표시할 정보 선택</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {availableCustomFields.map((field) => {
              const fieldLabels: { [key: string]: string } = {
                'department': '부서',
                'position': '직급', 
                'employeeId': '사번',
                'phone': '전화번호'
              }
              
              const fieldLabel = fieldLabels[field] || field
              
              return (
                <label key={field} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showCustomFields.includes(field)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setShowCustomFields([...showCustomFields, field])
                      } else {
                        setShowCustomFields(showCustomFields.filter(f => f !== field))
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm text-gray-700">{fieldLabel}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  placeholder="직원명 또는 사용자명"
                />
              </div>
            </div>

            <div>
              <label htmlFor="additionalDate" className="block text-sm font-medium text-gray-700 mb-2">
                추가 날짜 필터
              </label>
              <input
                type="date"
                id="additionalDate"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="선택사항"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                타입
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="ALL">전체</option>
                <option value="CHECK_IN">출근</option>
                <option value="CHECK_OUT">퇴근</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center"
              >
                <Search className="h-4 w-4 mr-2" />
                검색
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center"
                title="엑셀 내보내기"
              >
                <Download className="h-4 w-4 mr-2" />
                엑셀 내보내기
              </button>
            </div>
          </form>
        </div>

        {/* Attendance Records Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    출근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    퇴근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    근무시간
                  </th>
                  {showCustomFields.map((field) => {
                    const fieldLabels: { [key: string]: string } = {
                      'department': '부서',
                      'position': '직급', 
                      'employeeId': '사번',
                      'phone': '전화번호'
                    }
                    
                    const fieldLabel = fieldLabels[field] || field
                    
                    return (
                      <th key={field} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {fieldLabel}
                      </th>
                    )
                  })}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={6 + showCustomFields.length} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || dateFilter || typeFilter !== 'ALL' 
                        ? '검색 결과가 없습니다.' 
                        : '출퇴근 기록이 없습니다.'}
                    </td>
                  </tr>
                ) : (
                  attendanceSummaries.map((summary) => {
                    const customFields = summary.employee.customFields ? JSON.parse(summary.employee.customFields) : {}
                    return (
                      <tr key={`${summary.employee.id}-${summary.date}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{summary.employee.name}</div>
                            <div className="text-sm text-gray-500">@{summary.employee.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(summary.date).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {summary.checkIn ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {new Date(summary.checkIn.timestamp).toLocaleTimeString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {summary.checkIn.location || '-'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">미기록</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {summary.checkOut ? (
                            <div>
                              <div className="text-sm text-gray-900">
                                {new Date(summary.checkOut.timestamp).toLocaleTimeString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {summary.checkOut.location || '-'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">미기록</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {summary.totalHours && summary.totalHours > 0 ? (
                            <span className="text-sm font-medium text-gray-900">
                              {summary.totalHours}시간
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        {showCustomFields.map((field) => {
                          let value = '-'
                          
                          if (field === 'phone') {
                            value = summary.employee.phone || '-'
                          } else if (customFields[field]) {
                            value = customFields[field]
                          }
                          
                          return (
                            <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {value}
                            </td>
                          )
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            {summary.checkIn && (
                              <>
                                <button
                                  onClick={() => handleEditAttendance(summary.checkIn!)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                  title="출근 기록 수정"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAttendance(summary.checkIn!.id, summary.employee.name, 'CHECK_IN')}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                  title="출근 기록 삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {summary.checkOut && (
                              <>
                                <button
                                  onClick={() => handleEditAttendance(summary.checkOut!)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                  title="퇴근 기록 수정"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAttendance(summary.checkOut!.id, summary.employee.name, 'CHECK_OUT')}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                  title="퇴근 기록 삭제"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
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
                onClick={() => loadAttendances(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => loadAttendances(page)}
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
                onClick={() => loadAttendances(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </nav>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 기록 수</p>
                <p className="text-2xl font-bold text-gray-900">{attendances.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">오늘 출근</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendances.filter(a => 
                    a.type === 'CHECK_IN' && 
                    new Date(a.timestamp).toDateString() === new Date().toDateString()
                  ).length}
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
                <p className="text-sm font-medium text-gray-600">오늘 퇴근</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendances.filter(a => 
                    a.type === 'CHECK_OUT' && 
                    new Date(a.timestamp).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 수정 모달 */}
      {showEditModal && editingAttendance && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  출퇴근 기록 수정
                </h3>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    직원명
                  </label>
                  <input
                    type="text"
                    value={editingAttendance.employee.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜 및 시간
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.timestamp}
                    onChange={(e) => setEditForm({ ...editForm, timestamp: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    타입
                  </label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CHECK_IN">출근</option>
                    <option value="CHECK_OUT">퇴근</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    위치 (선택사항)
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="위치 정보를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateAttendance}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


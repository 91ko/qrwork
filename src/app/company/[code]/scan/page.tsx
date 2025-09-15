'use client'

import { useState, useEffect } from 'react'
import { QrCode, Camera, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useParams } from 'next/navigation'

interface ScanPageProps {
  params: {
    code: string
  }
}

export default function ScanPage() {
  const params = useParams()
  const companyCode = params.code as string
  
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [employeeId, setEmployeeId] = useState('')
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)

  const handleScan = () => {
    setIsScanning(true)
    setScanStatus('idle')
    setScanResult(null)
    
    // 실제로는 QR 스캔 라이브러리를 사용
    // 임시로 시뮬레이션
    setTimeout(() => {
      const mockQrData = {
        companyCode: companyCode,
        qrCodeId: 'qr_123',
        type: 'attendance'
      }
      
      setScanResult(JSON.stringify(mockQrData))
      setScanStatus('success')
      setIsScanning(false)
      setLastScanTime(new Date())
    }, 2000)
  }

  const handleSubmit = async () => {
    if (!scanResult || !employeeId) return
    
    try {
      // 실제로는 API 호출
      console.log('출퇴근 기록:', { scanResult, employeeId })
      
      // 성공 처리
      setScanStatus('success')
      setEmployeeId('')
      setScanResult(null)
    } catch (error) {
      setScanStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">QR워크</span>
              <span className="ml-4 text-lg text-gray-600">- QR 스캔</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">회사 코드</p>
              <p className="text-lg font-mono font-bold text-blue-600">{companyCode}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">QR 코드 스캔</h1>
          <p className="text-lg text-gray-600">
            QR 코드를 스캔하여 출퇴근을 기록하세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR 스캔 영역 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="bg-blue-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                {isScanning ? (
                  <div className="animate-spin">
                    <Camera className="h-16 w-16 text-blue-600" />
                  </div>
                ) : (
                  <QrCode className="h-16 w-16 text-blue-600" />
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {isScanning ? '스캔 중...' : 'QR 코드 스캔'}
              </h3>
              
              <p className="text-gray-600 mb-6">
                {isScanning 
                  ? 'QR 코드를 카메라에 비춰주세요' 
                  : '스캔 버튼을 눌러 QR 코드를 인식하세요'
                }
              </p>
              
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium"
              >
                {isScanning ? '스캔 중...' : 'QR 스캔 시작'}
              </button>
            </div>
          </div>

          {/* 스캔 결과 및 직원 정보 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">출퇴근 기록</h3>
            
            {/* 스캔 상태 표시 */}
            {scanStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-green-800 font-medium">스캔 성공!</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  QR 코드가 성공적으로 인식되었습니다.
                </p>
              </div>
            )}
            
            {scanStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">스캔 실패</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  QR 코드를 인식할 수 없습니다. 다시 시도해주세요.
                </p>
              </div>
            )}

            {/* 직원 ID 입력 */}
            <div className="mb-6">
              <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                직원 ID 또는 사번
              </label>
              <input
                type="text"
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="직원 ID를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 출퇴근 기록 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={!scanResult || !employeeId}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium"
            >
              출퇴근 기록하기
            </button>

            {/* 마지막 스캔 시간 */}
            {lastScanTime && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600">마지막 스캔:</span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {lastScanTime.toLocaleString('ko-KR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 사용 안내 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">사용 안내</h3>
          <ul className="text-blue-800 space-y-2">
            <li>• QR 코드를 카메라에 정확히 비춰주세요</li>
            <li>• 직원 ID는 관리자에게 문의하세요</li>
            <li>• 출퇴근 기록은 실시간으로 저장됩니다</li>
            <li>• 문제가 있으면 관리자에게 연락하세요</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

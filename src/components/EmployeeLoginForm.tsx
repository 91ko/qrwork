'use client'

import { QrCode } from 'lucide-react'

export default function EmployeeLoginForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const companyCode = formData.get('companyCode') as string
    if (companyCode) {
      window.location.href = `/company/${companyCode}/scan`
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            직원 출퇴근
          </h2>
          <p className="text-xl text-gray-600">
            회사 코드를 입력하고 로그인하여 출퇴근을 기록하세요
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-8">
          <div className="max-w-md mx-auto">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="companyCode" className="block text-sm font-medium text-gray-700 mb-2">
                  회사 코드
                </label>
                <input
                  type="text"
                  id="companyCode"
                  name="companyCode"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="회사 코드를 입력하세요"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                <QrCode className="h-5 w-5 mr-2" />
                출퇴근 페이지로 이동
              </button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                회사 코드를 모르시나요? 관리자에게 문의하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

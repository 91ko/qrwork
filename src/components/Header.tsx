'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QrCode, Menu, X } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <div className="flex items-center">
            <QrCode className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">QR워크</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            <Link
              href="/contact"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              문의하기
            </Link>
            <Link
              href="/auth/login"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              관리자 로그인
            </Link>
            <Link
              href="/employee/login"
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              직원 로그인
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              무료 체험 시작
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mb-4">
              <Link
                href="/contact"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                문의하기
              </Link>
              <Link
                href="/auth/login"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                관리자 로그인
              </Link>
              <Link
                href="/employee/login"
                className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                직원 로그인
              </Link>
              <Link
                href="/auth/register"
                className="bg-blue-600 hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                무료 체험 시작
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

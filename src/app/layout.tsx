import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'QR워크 - QR 코드 출퇴근 관리 시스템',
  description: 'QR 코드를 활용한 스마트한 출퇴근 관리 시스템. 회사별 독립적인 환경을 제공하며, 14일 무료 체험으로 쉽게 시작할 수 있습니다.',
  keywords: ['QR코드', '출퇴근', '관리', '시스템', '근태관리', 'QR워크'],
  authors: [{ name: 'QR워크' }],
  creator: 'QR워크',
  publisher: 'QR워크',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://qrwork.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'QR워크 - QR 코드 출퇴근 관리 시스템',
    description: 'QR 코드를 활용한 스마트한 출퇴근 관리 시스템',
    url: 'https://qrwork.vercel.app',
    siteName: 'QR워크',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'QR워크 - QR 코드 출퇴근 관리 시스템',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR워크 - QR 코드 출퇴근 관리 시스템',
    description: 'QR 코드를 활용한 스마트한 출퇴근 관리 시스템',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}

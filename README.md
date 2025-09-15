# QR워크 (QR Work) - QR 코드 출퇴근 관리 시스템

![QR워크 로고](https://img.shields.io/badge/QR워크-QR%20출퇴근%20관리%20시스템-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-6.16.1-2D3748?style=for-the-badge&logo=prisma)

## 📋 목차
- [프로젝트 개요](#-프로젝트-개요)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [설치 및 실행](#-설치-및-실행)
- [Vercel 배포](#-vercel-배포)
- [완료된 작업](#-완료된-작업)
- [향후 구현 예정](#-향후-구현-예정)

## 🎯 프로젝트 개요

QR워크는 QR 코드를 활용한 스마트한 출퇴근 관리 시스템입니다. 회사별로 독립적인 환경을 제공하며, 14일 무료 체험을 통해 쉽게 시작할 수 있습니다.

### 🌟 핵심 특징
- **멀티 테넌트**: 회사별 완전한 데이터 격리
- **동적 라우팅**: 회사 코드별 자동 페이지 생성
- **무료 체험**: 14일 무료 체험으로 부담 없이 시작
- **실시간 관리**: 실시간 출퇴근 현황 모니터링
- **모바일 친화적**: 반응형 디자인으로 모든 기기 지원

## ✨ 주요 기능

### 🏢 회사 관리
- [x] 회사 등록 및 고유 코드 생성
- [x] 14일 무료 체험 시스템
- [x] 회사별 독립적인 관리 환경
- [x] 관리자 계정 생성 및 관리

### 🔐 인증 시스템
- [x] JWT 기반 보안 인증
- [x] HTTP-only 쿠키로 XSS 방지
- [x] 비밀번호 해시화 (bcryptjs)
- [x] 회사별 관리자 권한 관리

### 📱 QR 코드 시스템
- [x] QR 코드 생성 및 관리
- [x] 위치별 QR 코드 설정
- [x] QR 코드 다운로드 및 공유
- [x] QR 코드 스캔 및 출퇴근 기록

### 👥 직원 관리
- [x] 직원 등록 및 관리
- [x] 사번 및 부서 정보 관리
- [x] 직원별 출퇴근 기록 조회
- [x] 직원 상태 관리 (활성/비활성)

### 📊 출퇴근 관리
- [x] 실시간 출퇴근 기록
- [x] 출퇴근 시간 자동 계산
- [x] 일별/월별 출퇴근 통계
- [x] 출퇴근 데이터 내보내기

### 🎛️ 관리자 대시보드
- [x] 통합 관리 대시보드
- [x] 실시간 통계 및 현황
- [x] 무료 체험 상태 모니터링
- [x] 직관적인 네비게이션

## 🛠️ 기술 스택

### Frontend
- **Next.js 15.5.3** - React 프레임워크
- **TypeScript 5.0** - 타입 안전성
- **Tailwind CSS 4.0** - 스타일링
- **Lucide React** - 아이콘
- **React Hook Form** - 폼 관리

### Backend
- **Next.js API Routes** - 서버리스 API
- **Prisma 6.16.1** - ORM
- **PostgreSQL 14+** - 데이터베이스
- **JWT** - 인증 토큰
- **bcryptjs** - 비밀번호 해시화

### 개발 도구
- **ESLint** - 코드 품질 관리
- **Prettier** - 코드 포맷팅
- **Turbopack** - 빠른 개발 서버

## 📁 프로젝트 구조

```
qrwork/
├── prisma/
│   └── schema.prisma          # 데이터베이스 스키마
├── public/
│   ├── robots.txt             # SEO 설정
│   └── *.svg                  # 정적 파일
├── src/
│   ├── app/
│   │   ├── api/               # API 라우트
│   │   │   ├── admin/         # 관리자 API
│   │   │   ├── app/           # 앱 API
│   │   │   ├── auth/          # 인증 API
│   │   │   └── company/       # 회사 API
│   │   ├── auth/              # 인증 페이지
│   │   │   ├── login/         # 로그인
│   │   │   └── register/      # 회원가입
│   │   ├── company/[code]/    # 회사별 동적 페이지
│   │   │   ├── admin/         # 관리자 페이지
│   │   │   │   ├── attendance/ # 출퇴근 관리
│   │   │   │   └── qr/        # QR 관리
│   │   │   ├── scan/          # QR 스캔 페이지
│   │   │   └── page.tsx       # 회사 대시보드
│   │   ├── globals.css        # 전역 스타일
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 홈페이지
│   │   └── sitemap.ts         # 사이트맵
│   ├── components/
│   │   └── StructuredData.tsx # SEO 구조화 데이터
│   └── lib/
│       ├── auth.ts            # 인증 유틸리티
│       └── company-utils.ts   # 회사 유틸리티
├── .env                       # 환경변수
├── .gitignore                 # Git 무시 파일
├── package.json               # 의존성 관리
├── tsconfig.json              # TypeScript 설정
└── README.md                  # 프로젝트 문서
```

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/91ko/qrwork.git
cd qrwork
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# 환경변수 설정
DATABASE_URL="postgresql://username:password@localhost:5432/qrwork_db"
JWT_SECRET="your_jwt_secret_key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"
```

### 4. 데이터베이스 설정
```bash
# PostgreSQL 설치 (macOS)
brew install postgresql
brew services start postgresql

# 데이터베이스 생성
createdb qrwork_db

# Prisma 마이그레이션
npx prisma generate
npx prisma db push
```

### 5. 개발 서버 실행
```bash
npm run dev
```

서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 🚀 Vercel 배포

### 1. Vercel CLI 설치
```bash
npm i -g vercel
```

### 2. 프로젝트 배포
```bash
vercel --prod
```

### 3. 환경변수 설정
Vercel 대시보드에서 다음 환경변수 설정:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: JWT 서명 키
- `NEXTAUTH_URL`: 배포된 도메인
- `NEXTAUTH_SECRET`: NextAuth 시크릿

### 4. 데이터베이스 설정
```bash
# Vercel Postgres 연결
vercel env add DATABASE_URL

# 마이그레이션 실행
npx prisma db push
```

## ✅ 완료된 작업

### 🏗️ 기본 구조 (100%)
- [x] Next.js 15.5.3 프로젝트 설정
- [x] TypeScript 설정 및 타입 정의
- [x] Tailwind CSS 스타일링 시스템
- [x] ESLint 및 코드 품질 관리
- [x] 프로젝트 폴더 구조 설계
- [x] Vercel 배포 설정

### 🌐 웹 인터페이스 (100%)
- [x] 홈페이지 및 랜딩 페이지
- [x] 반응형 디자인
- [x] SEO 최적화
- [x] 메타 태그 설정

## 🚧 향후 구현 예정

### 🗄️ 데이터베이스 (0%)
- [ ] PostgreSQL 데이터베이스 설정
- [ ] Prisma ORM 설정 및 스키마 설계
- [ ] 회사, 관리자, 직원, QR코드, 출퇴근 모델 정의
- [ ] 데이터베이스 관계 설정 및 제약조건
- [ ] 마이그레이션 및 시드 데이터

### 🔐 인증 시스템 (0%)
- [ ] JWT 기반 인증 시스템
- [ ] HTTP-only 쿠키 보안 설정
- [ ] bcryptjs 비밀번호 해시화
- [ ] 회사별 관리자 권한 관리
- [ ] 로그인/로그아웃 기능
- [ ] 토큰 검증 및 갱신

### 🏢 회사 관리 (0%)
- [ ] 회사 등록 및 고유 코드 생성
- [ ] 14일 무료 체험 시스템
- [ ] 회사별 데이터 격리
- [ ] 관리자 계정 생성
- [ ] 회사 정보 관리

### 📱 QR 코드 시스템 (0%)
- [ ] QR 코드 생성 API
- [ ] QR 코드 이미지 생성 (qrcode 라이브러리)
- [ ] QR 코드 목록 관리
- [ ] QR 코드 다운로드 기능
- [ ] QR 코드 스캔 및 검증

### 👥 직원 관리 (0%)
- [ ] 직원 등록 및 정보 관리
- [ ] 사번 및 부서 정보
- [ ] 직원 상태 관리
- [ ] 직원 대량 등록 (Excel 업로드)
- [ ] 직원 정보 수정 및 삭제

### 📊 출퇴근 관리 (0%)
- [ ] QR 스캔을 통한 출퇴근 기록
- [ ] 출퇴근 시간 자동 계산
- [ ] 일별 출퇴근 기록 조회
- [ ] 출퇴근 통계 및 분석
- [ ] 출퇴근 데이터 내보내기

### 🎛️ 관리자 대시보드 (0%)
- [ ] 통합 관리 대시보드
- [ ] 실시간 통계 카드
- [ ] 무료 체험 상태 표시
- [ ] 직관적인 네비게이션
- [ ] 반응형 디자인

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면 다음 단계를 따라주세요:

### 1. Fork 및 Clone
```bash
git clone https://github.com/your-username/qrwork.git
cd qrwork
```

### 2. 브랜치 생성
```bash
git checkout -b feature/your-feature-name
```

### 3. 개발 환경 설정
```bash
npm install
cp .env.example .env
# 환경변수 설정
```

### 4. 개발 및 테스트
```bash
npm run dev
npm run test
```

### 5. 커밋 및 푸시
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin feature/your-feature-name
```

### 6. Pull Request 생성
GitHub에서 Pull Request를 생성해주세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 프로젝트들의 도움을 받았습니다:

- [Next.js](https://nextjs.org/) - React 프레임워크
- [Prisma](https://prisma.io/) - 데이터베이스 ORM
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [Lucide React](https://lucide.dev/) - 아이콘 라이브러리
- [qrcode](https://github.com/soldair/node-qrcode) - QR 코드 생성

---

**QR워크로 스마트한 출퇴근 관리를 시작해보세요!** 🚀

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/91ko/qrwork)

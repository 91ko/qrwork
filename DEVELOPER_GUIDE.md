# QR워크 개발자 가이드

## 🛠️ 개발 환경 설정

### 필수 요구사항
- Node.js 18.x 이상
- PostgreSQL 14.x 이상
- Git

### 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/91ko/qrwork.git
cd qrwork_v2

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

## 📁 상세 프로젝트 구조

```
qrwork_v2/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                 # 메인 랜딩 페이지
│   │   ├── admin/                   # 관리자 페이지
│   │   │   ├── page.tsx            # 관리자 대시보드
│   │   │   ├── employees/          # 직원 관리
│   │   │   ├── attendance/         # 출퇴근 관리
│   │   │   ├── leave/              # 연차 관리
│   │   │   └── contracts/          # 전자근로계약서
│   │   ├── employee/               # 직원 페이지
│   │   │   ├── page.tsx           # 직원 대시보드
│   │   │   ├── attendance/        # 출퇴근 기록
│   │   │   ├── leave/             # 연차 신청
│   │   │   └── profile/           # 프로필 관리
│   │   └── api/                   # API 라우트
│   │       ├── auth/              # 인증 관련
│   │       ├── companies/         # 회사 관리
│   │       ├── employees/         # 직원 관리
│   │       ├── attendance/        # 출퇴근 관리
│   │       ├── leave/             # 연차 관리
│   │       └── contracts/         # 계약서 관리
│   ├── components/                 # 재사용 가능한 컴포넌트
│   │   ├── Header.tsx             # 헤더 컴포넌트
│   │   ├── QRScanner.tsx          # QR 코드 스캐너
│   │   ├── BeaconDetector.tsx     # Beacon 감지기
│   │   ├── AttendanceForm.tsx     # 출퇴근 폼
│   │   ├── EmployeeForm.tsx       # 직원 등록 폼
│   │   ├── LeaveRequestForm.tsx   # 연차 신청 폼
│   │   └── ContractForm.tsx       # 계약서 폼
│   ├── lib/                       # 유틸리티 함수
│   │   ├── auth.ts               # 인증 관련 함수
│   │   ├── db.ts                 # 데이터베이스 연결
│   │   ├── utils.ts              # 공통 유틸리티
│   │   └── validations.ts        # 데이터 검증
│   ├── types/                     # TypeScript 타입 정의
│   │   ├── auth.ts               # 인증 타입
│   │   ├── company.ts            # 회사 타입
│   │   ├── employee.ts           # 직원 타입
│   │   ├── attendance.ts         # 출퇴근 타입
│   │   └── leave.ts              # 연차 타입
│   └── styles/                    # 스타일 파일
│       └── globals.css           # 전역 스타일
├── prisma/                        # 데이터베이스 스키마
│   ├── schema.prisma             # Prisma 스키마
│   └── migrations/               # 마이그레이션 파일
├── public/                        # 정적 파일
│   ├── images/                   # 이미지 파일
│   └── icons/                    # 아이콘 파일
├── .env.example                   # 환경 변수 예시
├── .gitignore                     # Git 무시 파일
├── next.config.js                 # Next.js 설정
├── package.json                   # 프로젝트 의존성
├── tailwind.config.js             # Tailwind CSS 설정
└── tsconfig.json                  # TypeScript 설정
```

## 🔧 주요 컴포넌트 상세

### 1. Header 컴포넌트 (`src/components/Header.tsx`)
```typescript
interface HeaderProps {
  user?: User | null;
  company?: Company | null;
}

// 주요 기능:
// - 네비게이션 메뉴
// - 로그인/로그아웃 상태 관리
// - 반응형 모바일 메뉴
// - 사용자 정보 표시
```

### 2. QR 스캐너 컴포넌트 (`src/components/QRScanner.tsx`)
```typescript
interface QRScannerProps {
  onScan: (data: string) => void;
  onError: (error: string) => void;
}

// 주요 기능:
// - 카메라 접근 권한 요청
// - QR 코드 실시간 스캔
// - 스캔 결과 처리
// - 에러 핸들링
```

### 3. Beacon 감지기 컴포넌트 (`src/components/BeaconDetector.tsx`)
```typescript
interface BeaconDetectorProps {
  onDetect: (beaconData: BeaconData) => void;
  onError: (error: string) => void;
}

// 주요 기능:
// - 블루투스 권한 요청
// - Beacon 신호 감지
// - 신호 강도 측정
// - 자동 출퇴근 기록
```

### 4. 출퇴근 폼 컴포넌트 (`src/components/AttendanceForm.tsx`)
```typescript
interface AttendanceFormProps {
  employeeId: string;
  companyId: string;
  attendanceType: 'checkin' | 'checkout';
}

// 주요 기능:
// - GPS 위치 확인
// - 거리 검증
// - 출퇴근 기록 저장
// - 실시간 피드백
```

## 🗄️ 데이터베이스 스키마

### Prisma 스키마 (`prisma/schema.prisma`)
```prisma
model Company {
  id          String   @id @default(cuid())
  name        String
  address     String
  latitude    Float
  longitude   Float
  radius      Int      @default(150)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  employees   Employee[]
  attendance  Attendance[]
  leaveRequests LeaveRequest[]
  contracts   Contract[]
}

model Employee {
  id          String   @id @default(cuid())
  companyId   String
  name        String
  email       String   @unique
  password    String
  department  String?
  position    String?
  phone       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  company     Company  @relation(fields: [companyId], references: [id])
  attendance  Attendance[]
  leaveRequests LeaveRequest[]
}

model Attendance {
  id          String   @id @default(cuid())
  employeeId  String
  companyId   String
  type        AttendanceType
  timestamp   DateTime @default(now())
  latitude    Float?
  longitude   Float?
  method      AttendanceMethod @default(QR)
  
  employee    Employee @relation(fields: [employeeId], references: [id])
  company     Company  @relation(fields: [companyId], references: [id])
}

enum AttendanceType {
  CHECKIN
  CHECKOUT
}

enum AttendanceMethod {
  QR
  BEACON
}
```

## 🔐 인증 시스템

### JWT 토큰 관리 (`src/lib/auth.ts`)
```typescript
// 토큰 생성
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d'
  });
}

// 토큰 검증
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return null;
  }
}

// 미들웨어
export function withAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = payload;
    return handler(req, res);
  };
}
```

## 📍 위치 기반 보안

### GPS 거리 계산 (`src/lib/utils.ts`)
```typescript
// 두 좌표 간 거리 계산 (Haversine 공식)
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // 미터 단위
}

// 위치 검증
export function validateLocation(
  userLat: number, userLon: number,
  companyLat: number, companyLon: number,
  radius: number
): boolean {
  const distance = calculateDistance(userLat, userLon, companyLat, companyLon);
  return distance <= radius;
}
```

## 📡 Beacon 시스템

### Beacon 감지 로직 (`src/lib/beacon.ts`)
```typescript
interface BeaconData {
  uuid: string;
  major: number;
  minor: number;
  rssi: number;
  distance: number;
}

// RSSI를 거리로 변환
export function rssiToDistance(rssi: number, txPower: number = -59): number {
  if (rssi === 0) return -1.0;
  
  const ratio = rssi * 1.0 / txPower;
  if (ratio < 1.0) {
    return Math.pow(ratio, 10);
  } else {
    const accuracy = (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
    return accuracy;
  }
}

// Beacon 신호 감지
export function detectBeacon(beaconData: BeaconData[]): BeaconData | null {
  // 가장 가까운 Beacon 찾기
  const closestBeacon = beaconData.reduce((closest, current) => {
    return current.distance < closest.distance ? current : closest;
  });
  
  // 거리 임계값 확인 (예: 5미터)
  return closestBeacon.distance <= 5 ? closestBeacon : null;
}
```

## 🎨 UI/UX 구현

### Tailwind CSS 설정 (`tailwind.config.js`)
```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          50: '#f8fafc',
          500: '#64748b',
          600: '#475569',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
```

### 반응형 디자인 패턴
```typescript
// 모바일 우선 반응형 클래스
<div className="
  grid grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-4 md:gap-6 lg:gap-8
">
  {/* 컨텐츠 */}
</div>

// 조건부 렌더링
{isMobile ? (
  <MobileMenu />
) : (
  <DesktopMenu />
)}
```

## 🚀 성능 최적화

### 1. 코드 스플리팅
```typescript
// 동적 임포트
const QRScanner = dynamic(() => import('@/components/QRScanner'), {
  ssr: false,
  loading: () => <div>로딩 중...</div>
});

// 라우트 기반 스플리팅
const AdminDashboard = dynamic(() => import('@/app/admin/page'));
```

### 2. 이미지 최적화
```typescript
import Image from 'next/image';

<Image
  src="/images/hero-bg.jpg"
  alt="Hero Background"
  width={1920}
  height={1080}
  priority
  className="object-cover"
/>
```

### 3. API 최적화
```typescript
// 데이터베이스 쿼리 최적화
export async function getEmployees(companyId: string) {
  return await prisma.employee.findMany({
    where: { companyId },
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      position: true,
      isActive: true,
    },
    orderBy: { name: 'asc' }
  });
}
```

## 🧪 테스트

### 단위 테스트
```typescript
// utils.test.ts
import { calculateDistance, validateLocation } from '@/lib/utils';

describe('Location Utils', () => {
  test('should calculate distance correctly', () => {
    const distance = calculateDistance(37.5665, 126.9780, 37.5651, 126.9895);
    expect(distance).toBeCloseTo(1000, -2); // 약 1km
  });

  test('should validate location within radius', () => {
    const isValid = validateLocation(37.5665, 126.9780, 37.5651, 126.9895, 1500);
    expect(isValid).toBe(true);
  });
});
```

### 통합 테스트
```typescript
// attendance.test.ts
import { POST } from '@/app/api/attendance/route';

describe('Attendance API', () => {
  test('should create attendance record', async () => {
    const request = new Request('http://localhost:3000/api/attendance', {
      method: 'POST',
      body: JSON.stringify({
        employeeId: 'emp123',
        type: 'CHECKIN',
        latitude: 37.5665,
        longitude: 126.9780
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

## 🔧 개발 도구

### ESLint 설정 (`.eslintrc.json`)
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  }
}
```

### Prettier 설정 (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 📦 배포

### Vercel 배포 설정 (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret"
  }
}
```

### 환경 변수
```bash
# .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/qrwork"
JWT_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 🐛 디버깅

### 로깅 시스템
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  }
};
```

### 에러 바운더리
```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error caught by boundary', error);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
```

---

*이 개발자 가이드는 QR워크 시스템의 기술적 구현을 상세히 설명합니다. 개발 시 참고하여 일관성 있는 코드를 작성하세요.*

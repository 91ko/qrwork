# QR워크 API 문서

## 📋 API 개요

QR워크 시스템의 RESTful API 엔드포인트들을 문서화합니다. 모든 API는 JSON 형태로 요청/응답을 처리합니다.

## 🔐 인증

### JWT 토큰 기반 인증
```http
Authorization: Bearer <jwt_token>
```

### 토큰 획득
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "name": "홍길동",
    "email": "user@example.com",
    "role": "employee",
    "companyId": "company123"
  }
}
```

## 🏢 회사 관리 API

### 회사 등록
```http
POST /api/companies
Content-Type: application/json

{
  "name": "테스트 회사",
  "address": "서울시 강남구 테헤란로 123",
  "latitude": 37.5665,
  "longitude": 126.9780,
  "radius": 150
}
```

**응답:**
```json
{
  "success": true,
  "company": {
    "id": "company123",
    "name": "테스트 회사",
    "address": "서울시 강남구 테헤란로 123",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "radius": 150,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 회사 정보 조회
```http
GET /api/companies/{companyId}
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "company": {
    "id": "company123",
    "name": "테스트 회사",
    "address": "서울시 강남구 테헤란로 123",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "radius": 150,
    "employeeCount": 25,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 회사 설정 업데이트
```http
PUT /api/companies/{companyId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "업데이트된 회사명",
  "radius": 200
}
```

## 👥 직원 관리 API

### 직원 등록
```http
POST /api/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "김철수",
  "email": "kim@example.com",
  "password": "password123",
  "department": "개발팀",
  "position": "개발자",
  "phone": "010-1234-5678"
}
```

**응답:**
```json
{
  "success": true,
  "employee": {
    "id": "emp123",
    "name": "김철수",
    "email": "kim@example.com",
    "department": "개발팀",
    "position": "개발자",
    "phone": "010-1234-5678",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 직원 목록 조회
```http
GET /api/employees?page=1&limit=20&search=김
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "employees": [
    {
      "id": "emp123",
      "name": "김철수",
      "email": "kim@example.com",
      "department": "개발팀",
      "position": "개발자",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 직원 정보 수정
```http
PUT /api/employees/{employeeId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "김철수",
  "department": "기획팀",
  "position": "팀장"
}
```

### 직원 비밀번호 변경
```http
PUT /api/employees/{employeeId}/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### 직원 삭제 (비활성화)
```http
DELETE /api/employees/{employeeId}
Authorization: Bearer <token>
```

## ⏰ 출퇴근 관리 API

### 출퇴근 기록
```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "CHECKIN",
  "latitude": 37.5665,
  "longitude": 126.9780,
  "method": "QR"
}
```

**응답:**
```json
{
  "success": true,
  "attendance": {
    "id": "att123",
    "employeeId": "emp123",
    "type": "CHECKIN",
    "timestamp": "2024-01-01T09:00:00Z",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "method": "QR"
  }
}
```

### 출퇴근 기록 조회
```http
GET /api/attendance?employeeId=emp123&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "attendance": [
    {
      "id": "att123",
      "type": "CHECKIN",
      "timestamp": "2024-01-01T09:00:00Z",
      "method": "QR"
    },
    {
      "id": "att124",
      "type": "CHECKOUT",
      "timestamp": "2024-01-01T18:00:00Z",
      "method": "QR"
    }
  ]
}
```

### 출퇴근 통계
```http
GET /api/attendance/stats?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "stats": {
    "totalEmployees": 25,
    "presentToday": 23,
    "lateArrivals": 3,
    "earlyDepartures": 1,
    "averageWorkHours": 8.5,
    "attendanceRate": 92.0
  }
}
```

## 🏖️ 연차 관리 API

### 연차 신청
```http
POST /api/leave/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "startDate": "2024-02-01",
  "endDate": "2024-02-03",
  "type": "ANNUAL",
  "reason": "개인 사정"
}
```

**응답:**
```json
{
  "success": true,
  "leaveRequest": {
    "id": "leave123",
    "employeeId": "emp123",
    "startDate": "2024-02-01",
    "endDate": "2024-02-03",
    "type": "ANNUAL",
    "reason": "개인 사정",
    "status": "PENDING",
    "createdAt": "2024-01-15T00:00:00Z"
  }
}
```

### 연차 신청 목록 조회
```http
GET /api/leave/requests?status=PENDING&page=1&limit=20
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "leaveRequests": [
    {
      "id": "leave123",
      "employee": {
        "id": "emp123",
        "name": "김철수",
        "department": "개발팀"
      },
      "startDate": "2024-02-01",
      "endDate": "2024-02-03",
      "type": "ANNUAL",
      "reason": "개인 사정",
      "status": "PENDING",
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### 연차 승인/거부
```http
PUT /api/leave/requests/{requestId}/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "APPROVED",
  "comment": "승인합니다"
}
```

**응답:**
```json
{
  "success": true,
  "leaveRequest": {
    "id": "leave123",
    "status": "APPROVED",
    "approvedBy": "admin123",
    "approvedAt": "2024-01-16T00:00:00Z",
    "comment": "승인합니다"
  }
}
```

## 📄 전자근로계약서 API

### 계약서 생성
```http
POST /api/contracts
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": "emp123",
  "position": "개발자",
  "department": "개발팀",
  "startDate": "2024-01-01",
  "salary": 50000000,
  "workHours": 40,
  "benefits": "4대보험, 퇴직금"
}
```

**응답:**
```json
{
  "success": true,
  "contract": {
    "id": "contract123",
    "employeeId": "emp123",
    "position": "개발자",
    "department": "개발팀",
    "startDate": "2024-01-01",
    "salary": 50000000,
    "workHours": 40,
    "benefits": "4대보험, 퇴직금",
    "status": "DRAFT",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 계약서 목록 조회
```http
GET /api/contracts?status=SIGNED&page=1&limit=20
Authorization: Bearer <token>
```

### 계약서 서명
```http
PUT /api/contracts/{contractId}/sign
Authorization: Bearer <token>
Content-Type: application/json

{
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

## 📡 Beacon API

### Beacon 등록
```http
POST /api/beacons
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "입구 Beacon",
  "uuid": "12345678-1234-1234-1234-123456789abc",
  "major": 1,
  "minor": 1,
  "latitude": 37.5665,
  "longitude": 126.9780,
  "radius": 5
}
```

### Beacon 감지 기록
```http
POST /api/beacons/detect
Authorization: Bearer <token>
Content-Type: application/json

{
  "uuid": "12345678-1234-1234-1234-123456789abc",
  "major": 1,
  "minor": 1,
  "rssi": -65,
  "latitude": 37.5665,
  "longitude": 126.9780
}
```

## 📊 대시보드 API

### 관리자 대시보드 데이터
```http
GET /api/dashboard/admin
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "dashboard": {
    "totalEmployees": 25,
    "presentToday": 23,
    "pendingLeaveRequests": 3,
    "recentAttendance": [
      {
        "employeeName": "김철수",
        "type": "CHECKIN",
        "timestamp": "2024-01-01T09:00:00Z"
      }
    ],
    "attendanceStats": {
      "today": 92.0,
      "thisWeek": 88.5,
      "thisMonth": 90.2
    }
  }
}
```

### 직원 대시보드 데이터
```http
GET /api/dashboard/employee
Authorization: Bearer <token>
```

**응답:**
```json
{
  "success": true,
  "dashboard": {
    "todayAttendance": {
      "checkin": "2024-01-01T09:00:00Z",
      "checkout": null,
      "workHours": 0
    },
    "thisMonthStats": {
      "totalWorkDays": 22,
      "presentDays": 20,
      "leaveDays": 2,
      "averageWorkHours": 8.2
    },
    "pendingLeaveRequests": 1,
    "upcomingLeaves": [
      {
        "startDate": "2024-02-01",
        "endDate": "2024-02-03",
        "type": "ANNUAL"
      }
    ]
  }
}
```

## 🔍 검색 및 필터링

### 고급 검색
```http
GET /api/employees/search?q=김&department=개발팀&position=개발자&isActive=true
Authorization: Bearer <token>
```

### 날짜 범위 필터링
```http
GET /api/attendance?startDate=2024-01-01&endDate=2024-01-31&type=CHECKIN
Authorization: Bearer <token>
```

## 📱 파일 업로드

### 프로필 이미지 업로드
```http
POST /api/upload/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <image_file>
```

**응답:**
```json
{
  "success": true,
  "url": "https://cdn.qrwork.com/profiles/emp123.jpg"
}
```

### 계약서 파일 업로드
```http
POST /api/upload/contract
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <pdf_file>
```

## ⚠️ 에러 응답

### 일반적인 에러 형식
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 올바르지 않습니다",
    "details": {
      "email": "이메일 형식이 올바르지 않습니다"
    }
  }
}
```

### 에러 코드 목록
- `VALIDATION_ERROR`: 입력 데이터 검증 실패
- `UNAUTHORIZED`: 인증 실패
- `FORBIDDEN`: 권한 없음
- `NOT_FOUND`: 리소스를 찾을 수 없음
- `DUPLICATE_ENTRY`: 중복된 데이터
- `LOCATION_ERROR`: 위치 검증 실패
- `BEACON_ERROR`: Beacon 감지 실패
- `INTERNAL_ERROR`: 서버 내부 오류

## 🔄 웹소켓 이벤트

### 실시간 출퇴근 알림
```javascript
// 연결
const ws = new WebSocket('wss://api.qrwork.com/ws');

// 이벤트 수신
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'ATTENDANCE_UPDATE':
      console.log('출퇴근 기록 업데이트:', data.attendance);
      break;
    case 'LEAVE_REQUEST':
      console.log('새로운 연차 신청:', data.leaveRequest);
      break;
  }
};
```

## 📈 성능 최적화

### 페이지네이션
```http
GET /api/employees?page=1&limit=20&sort=name&order=asc
```

### 캐싱 헤더
```http
Cache-Control: public, max-age=300
ETag: "abc123"
```

### 압축
```http
Content-Encoding: gzip
```

## 🔒 보안 고려사항

### Rate Limiting
- 일반 API: 100 requests/minute
- 인증 API: 10 requests/minute
- 파일 업로드: 5 requests/minute

### CORS 설정
```http
Access-Control-Allow-Origin: https://qrwork.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
```

### 데이터 검증
- 모든 입력 데이터는 서버에서 검증
- SQL Injection 방지
- XSS 공격 방지

---

*이 API 문서는 QR워크 시스템의 모든 엔드포인트를 상세히 설명합니다. 개발 시 참고하여 올바른 API 호출을 하세요.*

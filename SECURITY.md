# 🔒 보안 가이드

## 개요
이 문서는 QR 출퇴근 시스템의 보안 설정 및 모범 사례를 설명합니다.

## 🚨 주요 보안 취약점 및 해결 방안

### 1. JWT 토큰 보안
**문제점:**
- 토큰 갱신 메커니즘 없음
- 토큰 무효화 불가
- 토큰 탈취 시 대응 불가

**해결 방안:**
- 세션 기반 인증 시스템 구현
- 토큰 갱신 메커니즘 추가
- 세션 무효화 기능 구현

### 2. QR 코드 스캔 보안
**문제점:**
- 위치 검증 없음
- 시간 제한 없음
- 중복 스캔 방지 부족

**해결 방안:**
- GPS 기반 위치 검증
- 시간대별 스캔 제한
- 중복 스캔 방지 로직

### 3. 세션 관리 보안
**문제점:**
- 동시 세션 제한 없음
- 세션 타임아웃 없음
- 세션 하이재킹 방지 부족

**해결 방안:**
- 동시 세션 수 제한
- 자동 세션 타임아웃
- IP 변경 감지

## 🛡️ 보안 설정

### 환경 변수 설정
```bash
# JWT 보안
JWT_SECRET="your-very-long-and-secure-jwt-secret-key-here-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# 데이터베이스 보안
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?sslmode=require"

# 최종 관리자 계정 (보안상 중요!)
SUPER_ADMIN_EMAIL="admin@yourcompany.com"
SUPER_ADMIN_PASSWORD="your-secure-password-here"
SUPER_ADMIN_NAME="최종 관리자"

# 보안 설정
NODE_ENV="production"
NEXT_PUBLIC_BASE_URL="https://your-domain.com"

# 레이트 리미팅
RATE_LIMIT_WINDOW_MS="900000"  # 15분
RATE_LIMIT_MAX_REQUESTS="100"  # 15분당 100회

# 세션 보안
SESSION_TIMEOUT_MS="86400000"  # 24시간
MAX_CONCURRENT_SESSIONS="3"   # 사용자당 최대 3개 세션
```

### 보안 헤더 설정
```typescript
// 자동으로 설정되는 보안 헤더들
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

## 🔐 인증 및 인가

### 사용자 역할
1. **Super Admin (최종 관리자)**
   - 모든 회사 관리
   - 시스템 전체 설정
   - 보안 모니터링

2. **Admin (회사 관리자)**
   - 해당 회사만 관리
   - 직원 및 QR 코드 관리
   - 출퇴근 기록 조회

3. **Employee (직원)**
   - 개인 출퇴근 기록
   - QR 코드 스캔
   - 개인 정보 수정

### 접근 제어 매트릭스
| 기능 | Super Admin | Admin | Employee |
|------|-------------|-------|----------|
| 회사 관리 | ✅ | ❌ | ❌ |
| 직원 관리 | ✅ | ✅ | ❌ |
| QR 코드 관리 | ✅ | ✅ | ❌ |
| 출퇴근 기록 조회 | ✅ | ✅ | ✅ (본인만) |
| QR 스캔 | ❌ | ❌ | ✅ |
| 통계 조회 | ✅ | ✅ | ❌ |

## 🚨 보안 모니터링

### 로그 모니터링
```typescript
// 보안 관련 로그 레벨
logger.security()  // 보안 이벤트
logger.auth()      // 인증 관련
logger.error()     // 에러 로그
logger.warn()      // 경고 로그
```

### 모니터링 대상
- 비정상적인 로그인 시도
- QR 스캔 실패 패턴
- 세션 하이재킹 시도
- API 레이트 리미팅 위반
- 위치 검증 실패

### 알림 설정
```typescript
// 보안 이벤트 발생 시 알림
- 5분 내 10회 이상 로그인 실패
- 비정상적인 위치에서 QR 스캔
- 동시 다중 세션 감지
- 관리자 계정 로그인
```

## 🔧 보안 강화 방법

### 1. 데이터베이스 보안
```sql
-- 사용자별 권한 설정
CREATE USER qrwork_app WITH PASSWORD 'secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO qrwork_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO qrwork_app;

-- 연결 제한
ALTER USER qrwork_app CONNECTION LIMIT 10;
```

### 2. 네트워크 보안
```nginx
# Nginx 보안 설정
server {
    # SSL/TLS 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # 보안 헤더
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 레이트 리미팅
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
}
```

### 3. 애플리케이션 보안
```typescript
// 입력 검증
const sanitizedInput = sanitizeInput(userInput);
const isValidEmail = validateEmail(email);
const passwordStrength = validatePassword(password);

// XSS 방지
const cleanHtml = sanitizeHtml(userHtml);

// CSRF 보호
const csrfToken = generateCSRFToken();
```

## 📋 보안 체크리스트

### 배포 전 체크리스트
- [ ] 모든 환경 변수 설정 완료
- [ ] JWT 시크릿 키 강도 확인 (32자 이상)
- [ ] 데이터베이스 연결 암호화
- [ ] HTTPS 설정 완료
- [ ] 보안 헤더 설정 확인
- [ ] 레이트 리미팅 설정
- [ ] 로그 모니터링 설정
- [ ] 백업 암호화 설정

### 정기 보안 점검
- [ ] 주간: 로그 분석 및 이상 패턴 확인
- [ ] 월간: 보안 업데이트 및 패치 적용
- [ ] 분기: 보안 감사 및 취약점 스캔
- [ ] 연간: 전체 보안 정책 검토

## 🚨 보안 사고 대응

### 1. 계정 탈취 의심 시
```bash
# 1. 해당 계정의 모든 세션 무효화
curl -X POST /api/admin/invalidate-sessions -d '{"userId":"user_id"}'

# 2. 비밀번호 강제 변경
curl -X POST /api/admin/force-password-change -d '{"userId":"user_id"}'

# 3. 로그 분석
grep "user_id" /var/log/application.log | tail -100
```

### 2. QR 코드 악용 시
```bash
# 1. 해당 QR 코드 비활성화
curl -X PUT /api/admin/qr/qr_id -d '{"isActive":false}'

# 2. 의심스러운 출퇴근 기록 조회
curl -X GET "/api/admin/attendance?date=2024-01-01&suspicious=true"

# 3. 위치 기반 분석
curl -X GET "/api/admin/attendance/location-analysis?qrId=qr_id"
```

### 3. 시스템 침입 시
```bash
# 1. 모든 관리자 세션 무효화
curl -X POST /api/super-admin/emergency-lockdown

# 2. 시스템 로그 수집
tar -czf security_incident_$(date +%Y%m%d_%H%M%S).tar.gz /var/log/

# 3. 데이터베이스 백업
pg_dump -h localhost -U postgres qrwork > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📞 보안 연락처

### 내부 보안팀
- 이메일: security@yourcompany.com
- 전화: 02-1234-5678
- 긴급: 010-1234-5678

### 외부 보안 업체
- 보안 감사: security-audit@external.com
- 침투 테스트: penetration-test@external.com

## 📚 추가 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js 보안 가이드](https://nextjs.org/docs/going-to-production#security)
- [PostgreSQL 보안](https://www.postgresql.org/docs/current/security.html)
- [JWT 보안 모범 사례](https://tools.ietf.org/html/rfc8725)

---

**⚠️ 중요:** 이 문서는 보안 설정의 기본 가이드입니다. 실제 운영 환경에서는 추가적인 보안 조치가 필요할 수 있습니다.

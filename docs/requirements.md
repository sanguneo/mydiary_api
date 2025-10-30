# 📘 일기 어플 (Diary App API)

> 개인 일기 작성, 조회, 잠금, 파일 업로드를 지원하는 **Hono + Supabase 기반 백엔드 서비스**  
> 간편 이메일 인증(매직링크)을 통해 회원가입과 로그인을 통합 처리하며,  
> 인증 기반의 개인 일기 CRUD 기능을 제공합니다.

---

# ✨ 일기 앱 서비스 소개 및 요구사항 (요약)

**프로젝트:** Private Emotion Diary  
**작성일:** 2025-10-28

---

## 개요 / 서비스 소개
본 서비스는 SNS형 공유 기능이 없는, 개인의 심리·감정·일상을 기록하는 모바일 일기 애플리케이션입니다.  
아날로그 느낌(줄노트, 원고지 등)을 살린 UI 제공을 목표로 하며, 사용자는 언제든지 자유롭게 생각이나 감정을 정리하여 기록할 수 있습니다.  
기본 철학은 **"나의 감정과 일상을 안전하게, 방해받지 않고 기록"** 하는 것에 있습니다.

---

## 핵심 가치
- 프라이버시 우선: 내용은 기본적으로 암호화되어 저장되며, 평문은 서버에 저장되지 않도록 설계(클라이언트 사이드 암호화 옵션 제공)
- 심리적 안전감: 작성 중에는 방해 요소를 최소화(음악 허용, 그 외 알림·공유 권장하지 않음)
- 단순성: 작성화면은 1 depth(단일 화면)로 설계, 읽기/목록은 2 depth로 간단히 접근
- 회고 기능: 달력과 대시보드를 통해 과거(작년, 재작년 등)의 동일한 '월/주/일' 기록을 비교하여 회고 가능

---

## 목표 (MVP 범위)
1. 사용자 인증(가입/로그인/로그아웃/토큰 리프레시) — Supabase Auth 사용  
2. 암호화된 일기 저장(본문은 ciphertext로 저장)  
3. 일기 잠금 기능 (잠긴 일기는 목록에서 보이나 본문 열람 시 비밀번호 필요)  
4. 감정 태그 추가 및 감정별 필터 (검색은 날짜 기준)  
5. 달력 + 대시보드 (과거 동일 날짜 비교 가능)  
6. 템플릿 기능 ("질문 받아보기" 등 작성 가이드 제공)  
7. 관리자 기능 (사용자 정지/복구, 감사 로그 기록)  

---

## 기능적 요구사항 (상세)

### 사용자(프런트엔드 관점)
- 가입, 로그인, 로그아웃, 토큰 리프레시 — Supabase Auth 사용
- 작성 화면은 음악 허용, 알림 차단
- 작성 시 AES-GCM 암호화 수행 (E2E 선택 가능)
- 메타데이터: 날짜, 감정 태그, 사용자 태그 등
- 목록 화면: 날짜별 정렬, 잠긴 항목은 미리보기만 표시
- 검색/필터: 날짜 및 감정 기반 (본문 검색 없음)
- 대시보드: 오늘의 날짜, 날씨, 미세먼지, 과거 회고

### 서버(백엔드 관점)
- 기술스택: Bun + Hono + Supabase
- 엔드포인트 예시:
  - `/auth/*` (회원가입/로그인/토큰 갱신/로그아웃)
  - `/users/me` (프로필 조회 및 수정)
  - `/diaries/*` (일기 CRUD, 잠금 해제)
  - `/uploads/presign` (업로드 URL 생성)
  - `/api/dev/*` (로컬 테스트용)
- 데이터베이스:
  - `profiles` — 사용자 프로필 및 계정키 메타
  - `entries` — 일기 암호문 및 메타데이터 저장
  - `admin_roles`, `audit_logs`
  - 모든 테이블에 RLS 적용 (본인 데이터만 접근)
- 암호화/키 관리:
  - 계정 생성 시 master key 생성 후 서버에서 wrap
  - 일기 본문은 클라이언트 AES-GCM으로 암호화 후 ciphertext 저장
  - 잠긴 항목 열람 시 인증 후 unwrap 수행
- 보안/감사:
  - 관리자 행동은 `audit_logs`에 기록
  - `SUPABASE_SERVICE_KEY`는 서버에서만 사용

---

## 비기능적 요구사항
- 평문 저장 금지
- Bun + Hono 기반 경량 서버
- Postman 컬렉션 및 마이그레이션 포함
- Codex 또는 .env 환경변수 사용

---

## 제약 및 제외 항목
- SNS 공유 기능 없음  
- 상담/위기 대응 기능 없음  
- 전체 텍스트 검색 미지원  

---

## 다음 단계
1. 요구사항 확정 후 API 스펙 고도화  
2. Postman 컬렉션 및 DB 마이그레이션 적용  
3. 클라이언트 암호화 예제 제공  
4. 관리자 감사/언래핑 절차 문서화  

---

## 🧭 서비스 개요

### 서비스 목표
- 이메일 인증으로 가입/로그인 통합  
- 안전한 개인 일기 보관  
- 클라우드 스토리지 기반 첨부파일 지원  
- 향후 감정 분석/회고 기능 확장  

---

## 주요 기술 스택
| 구분 | 기술 |
|------|------|
| Backend Runtime | Bun |
| Framework | Hono |
| DB & Auth | Supabase (PostgreSQL + Auth + Storage) |
| ORM | Supabase Client |
| Language | TypeScript |
| Validation | zod |
| Tooling | Postman, Codex 환경 변수 |

---

## 📜 API 명세 (요약)

### Auth
- **POST /auth/signup** — 이메일 입력 → 매직링크 전송  
- **GET /auth/verify** — 토큰 검증 및 로그인  
- **POST /auth/refresh** — 세션 갱신  
- **POST /auth/logout** — 로그아웃  

### Users
- **GET /users/me** — 내 프로필 조회  
- **PUT /users/me** — 프로필 수정  

### Uploads
- **POST /uploads/presign** — 업로드용 URL 발급  

### Diaries
- **POST /diaries** — 일기 작성  
- **GET /diaries** — 전체 목록 조회  
- **GET /diaries/list** — 조건별 목록 조회  
- **GET /diaries/:id** — 단일 조회  
- **POST /diaries/:id/unlock** — 잠금 해제  
- **PATCH /diaries/:id** — 일기 수정  
- **DELETE /diaries/:id** — 일기 삭제  

### Dev (Local Only)
- **POST /api/dev/token** — 개발용 토큰 발급  
- **GET /api/dev/verify** — 토큰 검증  

---

## 🧩 데이터 구조

**1. AuthenticatedUser**
- id: 사용자 UUID  
- email: 이메일 주소  
- role: 역할 (기본값: user, nullable)

**2. Diary**
- id: 일기 UUID  
- user_id: 작성자 ID  
- title: 제목  
- content: 본문 (암호화 저장)  
- is_locked: 잠금 여부  
- lock_password_hash: 잠금 비밀번호 해시 (nullable)  
- created_at / updated_at: 작성 및 수정 시각  

**3. DiaryCreateInput**
- title: 제목 (string)  
- content: 본문 (string)  
- is_locked: 잠금 여부 (boolean, optional)  
- lock_password: 평문 비밀번호 (optional, 암호화 전송)

**4. DiaryUpdateInput**
- title, content, is_locked, lock_password (모두 optional)  

**5. DiaryListFilter**
- from / to: 조회 기간  
- month: "YYYY-MM"  
- day: "YYYY-MM-DD"  
- offsetYear: 상대 연도 조회  

---

## 🧪 Postman 테스트 환경

- Base URL: http://localhost:7200  
- Collection: [diary-app_full.postman_collection.json](sandbox:/mnt/data/diary-app_full.postman_collection.json)  
- Variables:  
  - {{token}} — 인증 토큰  
  - {{email}} — 이메일 주소  
  - {{id}} — 일기 ID  

---

## 📅 향후 개선 계획
| 구분 | 내용 |
|------|------|
| UX | 잠금 해제 시 캐시 유지 |
| 기능 | 이미지/음성 일기, 감정/태그 필터 |
| 보안 | Refresh 토큰 회전 |
| AI | 감정 요약, 하루 회고문 자동생성 |
| Infra | Supabase Edge Functions 활용 |

---

**작성일:** 2025-10-30  
**작성자:** 일기 어플 프로젝트

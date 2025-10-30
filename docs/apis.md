# 📘 일기 어플 API 명세서 (v1.1)

**프로젝트명:** Private Emotion Diary  
**베이스 URL:** `http://localhost:7200`  
**버전:** v1.1.0  
**작성일:** 2025-10-30  
**작성자:** 개인 프로젝트  

---

## 🔐 AUTH (인증)

### 1. 회원가입 / 매직링크 발송  
**POST** `/auth/signup`

#### Type Definition
```ts
interface AuthSignupRequest {
  email: string;
}

interface AuthSignupResponse {
  ok: boolean;
  message: string;
  user_id?: string | null;
}
```

#### Example
**Request**
```json
{
  "email": "user@example.com"
}
```

**Response**
```json
{
  "ok": true,
  "message": "Verification email sent",
  "user_id": "0f91c3b4-2a12-4c4e-9c6a-8d4b2ea7bda0"
}
```

---

### 2. 세션 리프레시  
**POST** `/auth/refresh`

#### Type Definition
```ts
interface AuthRefreshResponse {
  ok: boolean;
  message: string;
}
```

**Response Example**
```json
{
  "ok": true,
  "message": "Session refreshed"
}
```

---

### 3. 로그아웃  
**POST** `/auth/logout`

#### Type Definition
```ts
interface AuthLogoutResponse {
  ok: boolean;
}
```

**Response Example**
```json
{
  "ok": true
}
```

---

## 👤 USERS (사용자 프로필)

### 1. 내 프로필 조회  
**GET** `/users/me`

#### Type Definition
```ts
interface UserProfile {
  id: string;
  email: string;
  display_name?: string | null;
  settings?: Record<string, any>;
}

interface UserProfileResponse {
  ok: boolean;
  profile: UserProfile;
}
```

**Response Example**
```json
{
  "ok": true,
  "profile": {
    "id": "88f5b5d4-ff2d-4bbf-8de4-b8d4b2fa9e00",
    "email": "user@example.com",
    "display_name": "유온",
    "settings": {
      "theme": "dark"
    }
  }
}
```

---

### 2. 프로필 수정  
**PUT** `/users/me`

#### Type Definition
```ts
interface UpdateProfileRequest {
  display_name?: string;
  settings?: Record<string, any>;
}

interface UpdateProfileResponse {
  ok: boolean;
  profile: UserProfile;
}
```

**Request Example**
```json
{
  "display_name": "유온",
  "settings": { "theme": "light" }
}
```

**Response Example**
```json
{
  "ok": true,
  "profile": {
    "id": "88f5b5d4-ff2d-4bbf-8de4-b8d4b2fa9e00",
    "display_name": "유온",
    "settings": { "theme": "light" }
  }
}
```

---

## 📦 UPLOADS (파일 업로드)

### 1. Presigned URL 생성  
**POST** `/uploads/presign`

#### Type Definition
```ts
interface PresignRequest {
  filename: string;
  contentType: string;
  bucket: "content";
}

interface PresignResponse {
  ok: boolean;
  url: string;
  key: string;
  expires_at: string;
}
```

**Request Example**
```json
{
  "filename": "photo.png",
  "contentType": "image/png",
  "bucket": "content"
}
```

**Response Example**
```json
{
  "ok": true,
  "url": "https://storage.supabase.co/content/photo.png?...",
  "key": "content/photo.png",
  "expires_at": "2025-10-30T12:00:00Z"
}
```

---

## 📔 DIARIES (일기)

### 1. 일기 작성  
**POST** `/diaries`

#### Type Definition
```ts
interface DiaryCreateInput {
  title: string;
  content: string;
  is_locked?: boolean;
  lock_password?: string;
}

interface Diary {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
}

interface DiaryResponse {
  success: boolean;
  data: Diary;
}
```

**Request Example**
```json
{
  "title": "My Day",
  "content": "오늘은 좋은 하루였어요.",
  "is_locked": false
}
```

**Response Example**
```json
{
  "success": true,
  "data": {
    "id": "07d43d5b-aba2-4d6c-93a9-938f91acb561",
    "title": "My Day",
    "is_locked": false,
    "created_at": "2025-10-30T09:11:00Z",
    "updated_at": "2025-10-30T09:11:00Z"
  }
}
```

---

### 2. 목록 조회  
**GET** `/diaries`

#### Type Definition
```ts
interface DiarySummary {
  id: string;
  title: string;
  is_locked: boolean;
  created_at: string;
}

interface DiaryListResponse {
  success: boolean;
  data: DiarySummary[];
}
```

**Response Example**
```json
{
  "success": true,
  "data": [
    {
      "id": "07d43d5b-aba2-4d6c-93a9-938f91acb561",
      "title": "My Day",
      "is_locked": false,
      "created_at": "2025-10-30T09:11:00Z"
    }
  ]
}
```

---

### 3. 잠금 해제  
**POST** `/diaries/:id/unlock`

#### Type Definition
```ts
interface DiaryUnlockRequest {
  password: string;
}

interface DiaryUnlockResponse {
  success: boolean;
  data: Diary;
}
```

**Request Example**
```json
{
  "password": "1234"
}
```

**Response Example**
```json
{
  "success": true,
  "data": {
    "id": "e9a13b3b-1a5c-4121-8c3d-0b4c4b1e5c90",
    "title": "비밀 일기",
    "content": "이건 나만 아는 이야기야.",
    "is_locked": true
  }
}
```

---

### 4. 일기 수정  
**PATCH** `/diaries/:id`

#### Type Definition
```ts
interface DiaryUpdateInput {
  title?: string;
  content?: string;
  is_locked?: boolean;
  lock_password?: string | null;
}
```

**Request Example**
```json
{
  "title": "수정된 제목",
  "content": "수정된 내용입니다."
}
```

**Response Example**
```json
{
  "success": true,
  "data": {
    "id": "07d43d5b-aba2-4d6c-93a9-938f91acb561",
    "title": "수정된 제목",
    "content": "수정된 내용입니다.",
    "updated_at": "2025-10-30T10:20:00Z"
  }
}
```

---

## 🧰 DEV (개발용 도구)

### 1. 개발용 토큰 발급  
**POST** `/api/dev/token`

#### Type Definition
```ts
interface DevTokenRequest {
  email: string;
}

interface DevTokenResponse {
  success: boolean;
  data: {
    user: { id: string; email: string };
    tokens: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: string;
      refreshTokenExpiresAt: string;
    };
  };
}
```

**Request Example**
```json
{
  "email": "local@test.com"
}
```

**Response Example**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "5c40e37d-1782-4d7d-8a1c-9d8a4b6d02fa",
      "email": "local@test.com"
    },
    "tokens": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "accessTokenExpiresAt": "2025-10-30T10:45:00Z",
      "refreshTokenExpiresAt": "2025-11-30T10:45:00Z"
    }
  }
}
```

---

## 🔒 인증 및 보안 정책

| 항목 | 설명 |
|------|------|
| Access Token | JWT (15분 만료) |
| Refresh Token | JWT (30일 만료) |
| 인증 방식 | Bearer Token 또는 HTTP Only Cookie |
| 보호 라우트 | `/users/*`, `/uploads/*`, `/diaries/*`, `/api/dev/verify` |
| 비밀번호 해시 | bcrypt |
| 데이터 암호화 | AES-GCM (클라이언트 사이드) |

---

## 📅 작성 정보
- **작성일:** 2025-10-30  
- **작성자:** 개인 프로젝트  
- **버전:** v1.1.0  
- **Base URL:** `http://localhost:7200`

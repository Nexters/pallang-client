# 흔적 남기기 플로우 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/trace/new`에서 시작해 책 선택 → 대목 입력(직접/사진 OCR) → 페이지·스포일러 → 꾸미기 → 병합 확인 → 의견 작성 → 완료까지 관통하는 흔적 작성 플로우를 구현한다.

**Architecture:** 스텝을 라우트 세그먼트로 분리하고 `app/trace/new/layout.tsx`의 Context Provider가 draft 하나를 전 구간에 걸쳐 들고 간다. 중간 저장 API가 없어 최종 `POST /api/opinions` 단일 호출로 Passage + Opinion + Decoration을 원자적으로 생성한다. API 호출은 전부 orval 생성 함수를 `_queries`에서 감싸 쓴다.

**Tech Stack:** Next.js 16 (App Router, cacheComponents), React 19, TanStack Query 5, Tailwind CSS 4, orval + fetch, Vitest + happy-dom + Testing Library, Storybook 10, Capacitor 8

**Spec:** `docs/superpowers/specs/2026-07-27-trace-create-flow-design.md`
**Issue:** [#34](https://github.com/Nexters/pallang-client/issues/34) · **Branch:** `feat/34-trace-create-flow`

## Global Constraints

이 프로젝트의 규약이다. **모든 태스크에 암묵적으로 적용된다.** 위반하면 `pnpm lint`가 실패한다.

- **default export 금지.** named export만 쓴다. 예외는 Next 특수 파일(`page.tsx`, `layout.tsx`, `not-found.tsx` 등), 설정 파일, Storybook `*.stories.tsx`의 meta.
- **배럴 파일 금지.** `index.ts` / `index.tsx`를 만들지도 import하지도 않는다. 항상 실제 파일 경로로 import한다.
- **컴포넌트 파일은 컴포넌트 하나만 export한다.** 내부 헬퍼 함수·상수는 export하지 않는다. 두 컴포넌트가 필요하면 파일을 나눈다.
- **컴포넌트 폴더 안에 `_hooks/`·`_services/` 같은 프라이빗 폴더를 중첩하지 않는다.**
- **파일명:** 컴포넌트 폴더/파일은 `PascalCase`(`BottomSheet/BottomSheet.tsx`), 그 외 `_hooks`/`_services`/`_data`/`_types`/`_queries`는 `camelCase`. 역할 접미사 `.service.ts` · `.store.ts` · `.constant.ts` · `.queries.ts` · `.api.ts` · `.type.ts` · `.spec.ts`를 붙인다.
- **`_apis` 직접 import 금지.** feature 코드는 `@/app/_global/_queries`의 queryOptions/mutationOptions만 쓴다. `**/_apis/**` import는 `app/_global/_queries/**` · `app/_global/_apis/**` · `app/_global/_tests/**`에서만 허용된다.
- **import 경로:** 같은 route 안은 상대경로, `_shared`/`_global`은 `@/` 절대경로.
- **`import type`** 을 타입 전용 import에 쓴다. import는 `simple-import-sort` 순서를 따른다. 순환 참조 금지.
- **객체 타입은 `type` 별칭**을 쓴다 (`interface` 금지).
- **`console.log` 금지.** `console.warn` / `console.error`만 허용.
- **`describe.only` / `it.only` / `.skip` / 주석 처리한 테스트를 커밋하지 않는다.**
- **`app/_global/_apis/_generated/**` 는 수동 수정 금지.** `pnpm api:gen`으로만 갱신한다. lint/prettier 대상에서 제외되어 있다.
- 커밋 메시지는 **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`). `commit-msg` 훅이 검사한다.
- 각 태스크 종료 시 `pnpm lint && pnpm typecheck && pnpm test`가 통과해야 한다.

**테스트 규약:** Vitest `globals: true`(import 없이 `describe`/`it`/`expect` 사용 가능하지만 기존 코드는 명시적 import를 쓴다 — 따라간다), 환경은 `happy-dom`, 테스트 파일은 각 폴더의 `_tests/*.spec.ts(x)`, `@` 별칭은 레포 루트.

---

## Task 1: orval 생성물 재생성

커밋된 생성물이 OpenAPI 스펙에 `required` 배열이 추가되기 **전** 시점의 것이다. `BookResponse.bookId?: number`처럼 실제로는 항상 오는 값이 전부 optional로 잡혀 있어 이후 모든 태스크에 불필요한 널 가드가 번진다. 먼저 걷어낸다.

**Files:**

- Modify: `app/_global/_apis/_generated/**` (도구가 생성 — 수동 편집 금지)

**Interfaces:**

- Produces: 재생성 후 `BookResponse`는 `bookId` · `title` · `author` · `publisher` · `pageCount` · `source`가 required가 되고 `isbn` · `coverImageUrl`만 `string | null`로 남는다. `TextBlock`은 `text` · `boundingBox` · `lineBreak`가, `Point`는 `x` · `y`가, `SimilarCandidate`는 `passageId` · `quotedText` · `pageNumber` · `opinionCount`가 required가 된다. 이후 태스크는 이 형태를 전제한다.

- [ ] **Step 1: 재생성 전 형태를 기록**

Run: `grep -n "bookId" app/_global/_apis/_generated/models/bookResponse.ts`
Expected: `bookId?: number` (optional)

- [ ] **Step 2: 생성 실행**

Run: `pnpm api:gen`

- [ ] **Step 3: required가 반영됐는지 확인**

Run: `grep -n "bookId\|coverImageUrl" app/_global/_apis/_generated/models/bookResponse.ts`
Expected: `bookId: number` (optional 표시 없음), `coverImageUrl?: string | null`

`bookId`가 여전히 `?`라면 스펙이 아직 갱신되지 않은 것이다. 진행을 멈추고 보고한다.

- [ ] **Step 4: 타입 검사와 테스트**

Run: `pnpm typecheck && pnpm test`
Expected: PASS. 기존 사용부는 `getHomeCarouselBooks` 뿐이고 optional → required는 사용부를 깨지 않는다.

- [ ] **Step 5: 커밋**

```bash
git add app/_global/_apis/_generated
git commit -m "chore: OpenAPI 스펙 갱신분으로 orval 생성물 재생성"
```

---

## Task 2: customFetch의 FormData Content-Type 버그 수정

`createOcrResult`는 `body: formData`를 Content-Type 없이 넘긴다. 현재 `customFetch`는 body가 있고 Content-Type이 없으면 무조건 `application/json`을 붙이므로 **multipart boundary가 사라져 사진 경로가 첫 호출부터 400으로 죽는다.**

**Files:**

- Modify: `app/_global/_apis/customFetch.api.ts`
- Test: `app/_global/_tests/customFetch.spec.ts` (기존 파일에 추가)

**Interfaces:**

- Consumes: 없음
- Produces: `customFetch(url, options)`의 동작 변경만. 시그니처는 그대로다.

- [ ] **Step 1: 실패하는 테스트 작성**

`app/_global/_tests/customFetch.spec.ts`의 `describe('customFetch', ...)` 블록 안, 마지막 `it` 뒤에 추가한다.

```ts
it('body가 FormData면 Content-Type을 설정하지 않는다', async () => {
  const spy = mockFetch(new Response('{}', { status: 200 }))
  const formData = new FormData()
  formData.append('image', new Blob(['x'], { type: 'image/png' }))

  await customFetch('/api/passages/ocr', { method: 'POST', body: formData })

  const headers = new Headers((spy.mock.calls[0]?.[1] as RequestInit).headers)
  expect(headers.has('Content-Type')).toBe(false)
})

it('body가 JSON 문자열이면 Content-Type을 application/json으로 설정한다', async () => {
  const spy = mockFetch(new Response('{}', { status: 200 }))

  await customFetch('/api/opinions', { method: 'POST', body: JSON.stringify({ bookId: 1 }) })

  const headers = new Headers((spy.mock.calls[0]?.[1] as RequestInit).headers)
  expect(headers.get('Content-Type')).toBe('application/json')
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- customFetch`
Expected: FAIL — "body가 FormData면..." 테스트가 `expected true to be false`로 떨어진다.

- [ ] **Step 3: 최소 구현**

`app/_global/_apis/customFetch.api.ts`에서 Content-Type 설정 부분을 바꾼다.

```ts
const isFormData = options.body instanceof FormData
if (options.body != null && !isFormData && !headers.has('Content-Type')) {
  headers.set('Content-Type', 'application/json')
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- customFetch`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add app/_global/_apis/customFetch.api.ts app/_global/_tests/customFetch.spec.ts
git commit -m "fix: FormData 요청에 Content-Type을 강제하지 않도록 수정

multipart boundary가 사라져 OCR 이미지 업로드가 400으로 실패했다."
```

---

## Task 3: 토큰 저장소와 401 회전 재발급

리프레시 토큰이 회전식(사용 즉시 폐기)이라 동시 401 두 건이 각자 재발급을 시도하면 서로의 토큰을 무효화한다. **재발급은 단일 in-flight Promise로 공유해야 한다.**

Provider를 두지 않는다. `no-restricted-imports`가 `**/_apis/**`를 `_global/_queries` · `_global/_apis` · `_global/_tests` 밖에서 금지하므로 `_providers`에서 `customFetch`를 참조할 수 없다. 토큰 주입을 `customFetch` 안쪽으로 내려 등록 시점 자체를 없앤다.

같은 이유로 재발급은 생성된 `refresh()`를 쓰지 않고 맨 `fetch`로 호출한다. `_generated/auth/auth.ts`가 `customFetch`를 import하므로 그걸 참조하면 `import/no-cycle`에 걸린다.

`ApiError`도 이 태스크에서 `app/_global/_data/api.model.ts`로 옮긴다. Task 16의 화면 코드가 에러 코드로 분기해야 하는데, `**/_apis/**` import 금지 규칙 때문에 feature에서 `customFetch.api`를 참조할 수 없기 때문이다.

**Files:**

- Create: `app/_global/_data/authToken.store.ts`
- Create: `app/_global/_data/api.model.ts`
- Create: `app/_global/_apis/authRefresh.api.ts`
- Modify: `app/_global/_apis/customFetch.api.ts`
- Modify: `.env.example`
- Modify: `env.d.ts`
- Test: `app/_global/_tests/authToken.spec.ts`
- Test: `app/_global/_tests/customFetch.spec.ts` (import 경로 변경 + 401 재시도 케이스 추가)

**Interfaces:**

- Consumes: Task 2의 `customFetch`
- Produces:
  - `ApiError` — `app/_global/_data/api.model.ts`로 이동. `constructor(status: number, code: string, message: string)`. feature 코드가 여기서 import한다.
  - `readAccessToken(): string | null`
  - `readRefreshToken(): string | null`
  - `writeTokens(tokens: { accessToken: string; refreshToken: string }): void`
  - `clearTokens(): void`
  - `refreshTokens(): Promise<string | null>` — 새 accessToken 또는 실패 시 null. 동시 호출은 하나의 Promise를 공유한다.

- [ ] **Step 1: 토큰 저장소 테스트 작성**

`app/_global/_tests/authToken.spec.ts`

```ts
import { afterEach, describe, expect, it } from 'vitest'

import {
  clearTokens,
  readAccessToken,
  readRefreshToken,
  writeTokens,
} from '@/app/_global/_data/authToken.store'

describe('authToken.store', () => {
  afterEach(() => {
    clearTokens()
  })

  it('저장한 토큰을 다시 읽을 수 있다', () => {
    writeTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    expect(readAccessToken()).toBe('access-1')
    expect(readRefreshToken()).toBe('refresh-1')
  })

  it('비어 있으면 null을 반환한다', () => {
    expect(readAccessToken()).toBeNull()
    expect(readRefreshToken()).toBeNull()
  })

  it('clearTokens는 둘 다 지운다', () => {
    writeTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    clearTokens()
    expect(readAccessToken()).toBeNull()
    expect(readRefreshToken()).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- authToken`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 3: 토큰 저장소 구현**

`app/_global/_data/authToken.store.ts`

```ts
const ACCESS_KEY = 'pallang.accessToken'
const REFRESH_KEY = 'pallang.refreshToken'

// TODO(auth): 카카오 로그인 구현 시 이 dev 시드를 제거한다.
// 로그인 화면이 없는 동안 env로 토큰을 주입해 인증이 필요한 API를 확인하기 위한 임시 장치다.
function seedFromEnv(key: string, value: string | undefined): void {
  if (value && window.localStorage.getItem(key) === null) {
    window.localStorage.setItem(key, value)
  }
}

function read(key: string): string | null {
  if (typeof window === 'undefined') return null
  seedFromEnv(ACCESS_KEY, process.env.NEXT_PUBLIC_DEV_ACCESS_TOKEN)
  seedFromEnv(REFRESH_KEY, process.env.NEXT_PUBLIC_DEV_REFRESH_TOKEN)
  return window.localStorage.getItem(key)
}

export function readAccessToken(): string | null {
  return read(ACCESS_KEY)
}

export function readRefreshToken(): string | null {
  return read(REFRESH_KEY)
}

export function writeTokens(tokens: { accessToken: string; refreshToken: string }): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACCESS_KEY, tokens.accessToken)
  window.localStorage.setItem(REFRESH_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACCESS_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- authToken`
Expected: PASS (3 tests)

- [ ] **Step 5: env 키 문서화**

`.env.example`에 추가한다.

```
# TODO(auth): 카카오 로그인 구현 전까지 인증 API를 확인하기 위한 임시 토큰 주입
NEXT_PUBLIC_DEV_ACCESS_TOKEN=
NEXT_PUBLIC_DEV_REFRESH_TOKEN=
```

`env.d.ts`의 `ProcessEnv`에 추가한다.

```ts
    readonly NEXT_PUBLIC_DEV_ACCESS_TOKEN?: string
    readonly NEXT_PUBLIC_DEV_REFRESH_TOKEN?: string
```

- [ ] **Step 5-1: ApiError를 `_data`로 이동**

`app/_global/_data/api.model.ts`를 만든다.

```ts
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

`app/_global/_tests/customFetch.spec.ts`의 `ApiError` import를 `@/app/_global/_data/api.model`에서 가져오도록 바꾼다. `customFetch.api.ts`는 Step 9에서 함께 정리한다.

- [ ] **Step 6: 재발급 모듈 구현**

`app/_global/_apis/authRefresh.api.ts`

```ts
import { clearTokens, readRefreshToken, writeTokens } from '../_data/authToken.store'

type TokenPayload = { accessToken: string; refreshToken: string }

// 리프레시 토큰은 회전식(사용 즉시 폐기)이라 동시 재발급이 서로를 무효화한다.
// in-flight Promise를 공유해 한 번만 나가게 한다.
let inFlight: Promise<string | null> | null = null

// 생성된 refresh()를 쓰면 _generated/auth/auth.ts → customFetch.api.ts 순환이 되므로
// 여기서만 맨 fetch로 직접 호출한다.
async function requestRefresh(refreshToken: string): Promise<string | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  const res = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return null
  const json = (await res.json().catch(() => null)) as { data?: TokenPayload } | null
  const tokens = json?.data
  if (!tokens) return null
  writeTokens(tokens)
  return tokens.accessToken
}

export function refreshTokens(): Promise<string | null> {
  inFlight ??= (async () => {
    const refreshToken = readRefreshToken()
    if (!refreshToken) return null
    // 네트워크 예외도 HTTP 실패와 같은 경로를 타야 한다. 여기서 흡수하지 않으면
    // clearTokens()가 건너뛰어져 만료 토큰이 남고, 호출부가 원래 ApiError 대신
    // raw TypeError를 받는다.
    const accessToken = await requestRefresh(refreshToken).catch(() => null)
    if (!accessToken) clearTokens()
    return accessToken
  })().finally(() => {
    inFlight = null
  })
  return inFlight
}
```

- [ ] **Step 7: customFetch의 401 재시도 테스트 작성**

`app/_global/_tests/customFetch.spec.ts`에 새 `describe`를 추가한다. 파일 상단 import에 `beforeEach`와 토큰 저장소를 더한다.

```ts
describe('customFetch 401 재발급', () => {
  beforeEach(() => {
    clearTokens()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    clearTokens()
  })

  it('401이면 재발급 후 원 요청을 새 토큰으로 재시도한다', async () => {
    writeTokens({ accessToken: 'old', refreshToken: 'refresh-1' })
    const spy = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { accessToken: 'new', refreshToken: 'refresh-2' } }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    vi.stubGlobal('fetch', spy)

    await expect(customFetch('/api/books/recent', { method: 'GET' })).resolves.toEqual({ ok: true })

    expect(spy).toHaveBeenCalledTimes(3)
    const retryHeaders = new Headers((spy.mock.calls[2]?.[1] as RequestInit).headers)
    expect(retryHeaders.get('Authorization')).toBe('Bearer new')
  })

  it('재발급이 실패하면 토큰을 폐기하고 ApiError를 던진다', async () => {
    writeTokens({ accessToken: 'old', refreshToken: 'refresh-1' })
    const spy = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ title: 'AUTH_401_1', detail: '로그인이 필요합니다.' }), {
          status: 401,
        }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
    vi.stubGlobal('fetch', spy)

    const error = await customFetch('/api/books/recent', { method: 'GET' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401, code: 'AUTH_401_1' })
    expect(readAccessToken()).toBeNull()
  })

  it('refreshToken이 없으면 재발급을 시도하지 않는다', async () => {
    const spy = mockFetch(new Response(JSON.stringify({ title: 'AUTH_401_1' }), { status: 401 }))

    await customFetch('/api/books/recent', { method: 'GET' }).catch(() => null)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('동시에 401이 두 건 나도 재발급은 한 번만 호출한다', async () => {
    writeTokens({ accessToken: 'old', refreshToken: 'refresh-1' })
    const spy = vi.fn().mockImplementation((url: string) => {
      if (url.endsWith('/api/auth/refresh')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({ data: { accessToken: 'new', refreshToken: 'refresh-2' } }),
            { status: 200 },
          ),
        )
      }
      return Promise.resolve(new Response('{}', { status: 401 }))
    })
    vi.stubGlobal('fetch', spy)

    await Promise.all([
      customFetch('/api/books/recent', { method: 'GET' }).catch(() => null),
      customFetch('/api/users/me', { method: 'GET' }).catch(() => null),
    ])

    const refreshCalls = spy.mock.calls.filter(([url]) => String(url).endsWith('/api/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
  })
})
```

마지막 테스트의 mock은 재발급 외 모든 요청에 401을 돌려준다. 두 요청이 동시에 401을 받아 각자 `refreshTokens()`를 부르지만, in-flight Promise 공유 덕분에 `/api/auth/refresh` 호출은 한 번만 나가야 한다. 공유가 없으면 두 번 나가서 회전식 리프레시 토큰이 서로를 무효화한다.

파일 상단 import를 다음으로 맞춘다.

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { customFetch, setAccessTokenGetter } from '@/app/_global/_apis/customFetch.api'
import { ApiError } from '@/app/_global/_data/api.model'
import { clearTokens, readAccessToken, writeTokens } from '@/app/_global/_data/authToken.store'
```

`ApiError`는 Step 5-1에서 `_data/api.model.ts`로 옮겼으므로 `customFetch.api`가 아니라 거기서 가져온다.

- [ ] **Step 8: 테스트가 실패하는지 확인**

Run: `pnpm test -- customFetch`
Expected: FAIL — 401 재발급 테스트 3개가 떨어진다 (재시도가 일어나지 않아 호출 횟수가 1).

- [ ] **Step 9: customFetch에 401 재시도 구현**

`app/_global/_apis/customFetch.api.ts`를 다음으로 바꾼다. `setAccessTokenGetter`는 테스트 override용으로 남기되 기본값이 저장소를 읽도록 한다.

```ts
// orval mutator — 생성된 fetch 함수가 이 함수를 경유한다.
import { ApiError } from '../_data/api.model'
import { readAccessToken, readRefreshToken } from '../_data/authToken.store'
import { refreshTokens } from './authRefresh.api'

type ErrorBody = {
  type?: string
  title?: string
  status?: number
  detail?: string
}

type AccessTokenGetter = () => string | null

let getAccessToken: AccessTokenGetter = readAccessToken

export function setAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter
}

function buildInit(options: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const isFormData = options.body instanceof FormData
  if (options.body != null && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  return { ...options, headers }
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => null)) as ErrorBody | null
  return new ApiError(
    res.status,
    body?.title ?? `HTTP_${String(res.status)}`,
    body?.detail ?? res.statusText,
  )
}

export async function customFetch<T>(url: string, options: RequestInit): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  let res = await fetch(`${baseUrl}${url}`, buildInit(options, getAccessToken()))

  if (res.status === 401 && readRefreshToken()) {
    const nextToken = await refreshTokens()
    if (nextToken) {
      res = await fetch(`${baseUrl}${url}`, buildInit(options, nextToken))
    }
  }

  if (!res.ok) throw await toApiError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
```

주의: `setAccessTokenGetter(() => null)`로 리셋하는 기존 `afterEach`가 이후 테스트의 기본 동작을 바꾼다. 기존 `describe('customFetch')`의 `afterEach`를 `setAccessTokenGetter(readAccessToken)`으로 되돌린다.

- [ ] **Step 10: 전체 테스트 통과 확인**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

- [ ] **Step 11: 커밋**

```bash
git add app/_global/_data app/_global/_apis/authRefresh.api.ts \
  app/_global/_apis/customFetch.api.ts app/_global/_tests .env.example env.d.ts
git commit -m "feat: 액세스 토큰 저장소와 401 회전 재발급 추가

리프레시 토큰이 회전식이라 동시 401이 서로의 토큰을 무효화하지 않도록
재발급을 단일 in-flight Promise로 공유한다."
```

---

## Task 4: BottomSheet 컴포넌트

저장 방식 선택과 직접 입력 두 곳에서 쓴다.

**Files:**

- Create: `app/_global/_components/BottomSheet/BottomSheet.tsx`
- Create: `app/_global/_components/BottomSheet/BottomSheet.stories.tsx`
- Test: `app/_global/_tests/bottomSheet.spec.tsx`

**Interfaces:**

- Produces: `BottomSheet({ open, title, onClose, children })` — `open`이 false면 아무것도 렌더하지 않는다. 배경 클릭과 닫기 버튼, Escape 키가 모두 `onClose`를 호출한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`app/_global/_tests/bottomSheet.spec.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'

describe('BottomSheet', () => {
  it('open이 false면 렌더하지 않는다', () => {
    render(
      <BottomSheet open={false} title="새로운 흔적을 어떻게 남길까요?" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('open이면 제목과 본문을 보여준다', () => {
    render(
      <BottomSheet open title="새로운 흔적을 어떻게 남길까요?" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('새로운 흔적을 어떻게 남길까요?')).toBeInTheDocument()
    expect(screen.getByText('본문')).toBeInTheDocument()
  })

  it('닫기 버튼을 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="제목" onClose={onClose}>
        <p>본문</p>
      </BottomSheet>,
    )
    await userEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('Escape 키를 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="제목" onClose={onClose}>
        <p>본문</p>
      </BottomSheet>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

`@testing-library/user-event`가 없으면 먼저 설치한다: `pnpm add -D @testing-library/user-event`

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- bottomSheet`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 3: 구현**

`app/_global/_components/BottomSheet/BottomSheet.tsx`

```tsx
'use client'

import { type ReactNode, useEffect } from 'react'

import CloseIcon from '../Icon/assets/close.svg'

type BottomSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        aria-label="배경 닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex flex-col gap-4 rounded-t-[20px] bg-bg-default px-4 pt-6 pb-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-title-18sb text-text-primary">{title}</h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex size-6 items-center justify-center text-icon-primary"
          >
            <CloseIcon aria-hidden="true" className="size-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

배경 버튼의 label이 `"배경 닫기"`인 이유: 둘 다 `"닫기"`면 `getByRole('button', { name: '닫기' })`가 두 개를 찾아 테스트가 실패한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- bottomSheet`
Expected: PASS (4 tests)

- [ ] **Step 5: 스토리 작성**

`app/_global/_components/BottomSheet/BottomSheet.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'

const meta = {
  title: 'Components/BottomSheet',
  component: BottomSheet,
  args: {
    open: true,
    title: '새로운 흔적을 어떻게 남길까요?',
    onClose: () => undefined,
    children: <p className="text-body-16rg text-text-secondary">본문이 들어갑니다.</p>,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="relative h-[600px] w-[375px] overflow-hidden bg-bg-surface">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomSheet>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Closed: Story = {
  args: { open: false },
}
```

기존 스토리와 동일하게 `@/` 절대경로 import, `title: 'Components/<이름>'`, `satisfies Meta<typeof X>` + `type Story = StoryObj<typeof meta>` 형태를 쓴다.

- [ ] **Step 6: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/_global/_components/BottomSheet app/_global/_tests/bottomSheet.spec.tsx package.json pnpm-lock.yaml
git commit -m "feat: 공용 BottomSheet 컴포넌트 추가"
```

---

## Task 5: Dialog와 Snackbar 컴포넌트

둘 다 상태 없는 프레젠테이션 셸이라 한 태스크로 묶는다.

**Files:**

- Create: `app/_global/_components/Dialog/Dialog.tsx`
- Create: `app/_global/_components/Dialog/Dialog.stories.tsx`
- Create: `app/_global/_components/Snackbar/Snackbar.tsx`
- Create: `app/_global/_components/Snackbar/Snackbar.stories.tsx`
- Test: `app/_global/_tests/snackbar.spec.tsx`

**Interfaces:**

- Produces:
  - `Dialog({ open, title, children })` — 중앙 모달. 닫기 버튼이 없다(병합 다이얼로그는 두 선택지 중 하나를 반드시 골라야 한다). 버튼은 `children`으로 넣는다.
  - `Snackbar({ message, onClose })` — 하단 고정 토스트. `message`가 빈 문자열이면 렌더하지 않는다. 자동 소멸은 사용부 책임이 아니라 이 컴포넌트가 3초 타이머로 처리한다.

- [ ] **Step 1: Snackbar 테스트 작성**

`app/_global/_tests/snackbar.spec.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

describe('Snackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('message가 비어 있으면 렌더하지 않는다', () => {
    render(<Snackbar message="" onClose={vi.fn()} />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('message를 보여준다', () => {
    render(<Snackbar message="영역 선택 후 효과를 입력해주세요!" onClose={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent('영역 선택 후 효과를 입력해주세요!')
  })

  it('3초 뒤 onClose를 호출한다', () => {
    const onClose = vi.fn()
    render(<Snackbar message="저장에 실패했어요" onClose={onClose} />)
    expect(onClose).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onClose).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- snackbar`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 3: Snackbar 구현**

`app/_global/_components/Snackbar/Snackbar.tsx`

```tsx
'use client'

import { useEffect } from 'react'

import CloseIcon from '../Icon/assets/close.svg'

type SnackbarProps = {
  message: string
  onClose: () => void
}

const AUTO_DISMISS_MS = 3000

export function Snackbar({ message, onClose }: SnackbarProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, AUTO_DISMISS_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [message, onClose])

  if (!message) return null

  return (
    <div
      role="status"
      className="absolute inset-x-4 bottom-24 z-30 flex items-center justify-between gap-4 rounded-lg bg-bg-default px-4 py-3"
    >
      <span className="text-body-14md text-text-accent">{message}</span>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="flex size-5 shrink-0 items-center justify-center text-icon-primary"
      >
        <CloseIcon aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- snackbar`
Expected: PASS (3 tests)

- [ ] **Step 5: Dialog 구현**

`app/_global/_components/Dialog/Dialog.tsx`

```tsx
import type { ReactNode } from 'react'

type DialogProps = {
  open: boolean
  title: ReactNode
  children: ReactNode
}

export function Dialog({ open, title, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-84 flex-col gap-5 rounded-[20px] bg-bg-default px-5 py-7"
      >
        <h2 className="whitespace-pre-line text-center text-title-18sb text-text-primary">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 스토리 두 개 작성**

`app/_global/_components/Dialog/Dialog.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Dialog } from '@/app/_global/_components/Dialog/Dialog'

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  args: {
    open: true,
    title: '기존 문장과 유사해요.\n의견을 하나로 모을까요?',
    children: (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="rounded-2xl bg-interactive-accent py-4 text-body-16bd text-text-inverse"
        >
          합칠게요
        </button>
        <button
          type="button"
          className="rounded-2xl bg-interactive-btn-primary py-4 text-body-16bd text-text-inverse"
        >
          따로 남길게요
        </button>
      </div>
    ),
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="relative h-[600px] w-[375px] overflow-hidden bg-bg-surface">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
```

`app/_global/_components/Snackbar/Snackbar.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

const meta = {
  title: 'Components/Snackbar',
  component: Snackbar,
  args: {
    message: '영역 선택 후 효과를 입력해주세요!',
    onClose: () => undefined,
  },
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div className="relative h-[240px] w-[375px] overflow-hidden bg-bg-dark">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Snackbar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SaveFailed: Story = {
  args: { message: '흔적을 남기지 못했어요. 잠시 후 다시 시도해주세요.' },
}
```

- [ ] **Step 7: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/_global/_components/Dialog app/_global/_components/Snackbar app/_global/_tests/snackbar.spec.tsx
git commit -m "feat: 공용 Dialog·Snackbar 컴포넌트 추가"
```

---

## Task 6: SegmentedControl 컴포넌트

스포일러 없어요/있어요 2택 토글.

**Files:**

- Create: `app/_global/_components/SegmentedControl/SegmentedControl.tsx`
- Create: `app/_global/_components/SegmentedControl/SegmentedControl.stories.tsx`
- Test: `app/_global/_tests/segmentedControl.spec.tsx`

**Interfaces:**

- Produces: `SegmentedControl({ options, value, onChange, label })` — `options`는 `readonly { value: string; label: string }[]`. 선택된 항목에 `aria-checked="true"`가 붙는다. 컨테이너는 `role="radiogroup"`, 항목은 `role="radio"`.

- [ ] **Step 1: 실패하는 테스트 작성**

`app/_global/_tests/segmentedControl.spec.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'

const options = [
  { value: 'no', label: '없어요' },
  { value: 'yes', label: '있어요' },
] as const

describe('SegmentedControl', () => {
  it('선택된 항목만 aria-checked가 true다', () => {
    render(<SegmentedControl label="스포일러" options={options} value="no" onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: '없어요' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '있어요' })).toHaveAttribute('aria-checked', 'false')
  })

  it('다른 항목을 누르면 그 값으로 onChange를 호출한다', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="스포일러" options={options} value="no" onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: '있어요' }))
    expect(onChange).toHaveBeenCalledWith('yes')
  })

  it('이미 선택된 항목을 눌러도 onChange를 호출한다', async () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="스포일러" options={options} value="no" onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: '없어요' }))
    expect(onChange).toHaveBeenCalledWith('no')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- segmentedControl`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 3: 구현**

`app/_global/_components/SegmentedControl/SegmentedControl.tsx`

```tsx
'use client'

import { cn } from '@/app/_global/_services/cn.service'

type SegmentedControlOption = { value: string; label: string }

type SegmentedControlProps = {
  label: string
  options: readonly SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
}

export function SegmentedControl({ label, options, value, onChange }: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-1 rounded-full bg-bg-gray p-1 text-body-16md"
    >
      {options.map((option) => {
        const isSelected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              onChange(option.value)
            }}
            className={cn(
              'flex-1 rounded-full py-3 text-center transition-colors',
              isSelected ? 'bg-bg-default text-text-primary' : 'text-text-inverse opacity-50',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- segmentedControl`
Expected: PASS (3 tests)

- [ ] **Step 5: 스토리 작성 후 커밋**

`app/_global/_components/SegmentedControl/SegmentedControl.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl,
  args: {
    label: '스포일러',
    options: [
      { value: 'no', label: '없어요' },
      { value: 'yes', label: '있어요' },
    ],
    value: 'no',
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="w-[343px] bg-bg-dark p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SegmentedControl>

export default meta

type Story = StoryObj<typeof meta>

export const NoSpoiler: Story = {}

export const HasSpoiler: Story = {
  args: { value: 'yes' },
}
```

Run: `pnpm lint && pnpm typecheck && pnpm test`

```bash
git add app/_global/_components/SegmentedControl app/_global/_tests/segmentedControl.spec.tsx
git commit -m "feat: 공용 SegmentedControl 컴포넌트 추가"
```

---

## Task 7: draft 상태 (타입 · reducer · Context)

플로우 전 구간의 입력을 담는 단일 draft다. 이 태스크의 reducer가 이후 모든 화면의 기반이 된다.

React Context를 `_data/traceDraft.store.ts`에 함께 둔다. 컴포넌트 파일은 컴포넌트 하나만 export할 수 있어 Provider 파일에서 Context를 내보낼 수 없고, Provider와 훅이 서로를 import하면 순환이 되기 때문이다.

**Files:**

- Create: `app/trace/new/_types/traceDraft.type.ts`
- Create: `app/trace/new/_data/traceDraft.store.ts`
- Create: `app/trace/new/_components/TraceDraftProvider/TraceDraftProvider.tsx`
- Create: `app/trace/new/_hooks/useTraceDraft.ts`
- Test: `app/trace/new/_tests/traceDraft.spec.ts`

**Interfaces:**

- Consumes: 없음. `effectType` 유니온은 `_apis` import 금지 규칙 때문에 생성 타입을 쓰지 못하고 여기서 로컬로 정의한다(값은 동일해 Task 16에서 그대로 대입된다).
- Produces:
  - 타입 `SelectedBook`, `DraftEffectType`, `DraftDecoration`, `TraceDraft`, `TraceDraftAction`
  - `initialTraceDraft: TraceDraft`
  - `traceDraftReducer(state: TraceDraft, action: TraceDraftAction): TraceDraft`
  - `TraceDraftContext` — `{ draft: TraceDraft; dispatch: Dispatch<TraceDraftAction> } | null`
  - `TraceDraftProvider({ children })`
  - `useTraceDraft(): { draft: TraceDraft; dispatch: Dispatch<TraceDraftAction> }` — Provider 밖에서 호출하면 throw

- [ ] **Step 1: 타입 정의**

`app/trace/new/_types/traceDraft.type.ts`

`_apis` import 금지 규칙은 **타입 전용 import에도 적용된다.** 생성된 `DecorationRequestEffectType`을 쓸 수 없으므로 같은 값의 유니온을 로컬로 선언한다.

```ts
export type SelectedBook = {
  bookId: number
  title: string
  author: string
  coverImageUrl: string | null
  pageCount: number | null
}

/** 생성 타입 DecorationRequestEffectType과 값이 같다. _apis import 금지 규칙 때문에 로컬로 둔다. */
export type DraftEffectType = 'UNDERLINE' | 'WAVY' | 'HIGHLIGHT'

export type DraftDecoration = {
  startOffset: number
  /** exclusive — quotedText.slice(startOffset, endOffset) */
  endOffset: number
  effectType: DraftEffectType
  color: string
}

export type TraceDraft = {
  book: SelectedBook | null
  source: 'manual' | 'photo' | null
  quotedText: string
  pageNumber: number | null
  isSpoiler: boolean
  decorations: DraftDecoration[]
  content: string
  passageId: number | null
  result: { opinionId: number; merged: boolean } | null
}

export type TraceDraftAction =
  | { type: 'selectBook'; book: SelectedBook }
  | { type: 'setSource'; source: 'manual' | 'photo' }
  | { type: 'setQuotedText'; quotedText: string }
  | { type: 'setPageDetail'; pageNumber: number; isSpoiler: boolean }
  | { type: 'applyDecoration'; decoration: DraftDecoration }
  | { type: 'removeDecoration'; startOffset: number }
  | { type: 'setContent'; content: string }
  | { type: 'setMergeTarget'; passageId: number | null }
  | { type: 'setResult'; result: { opinionId: number; merged: boolean } }
  | { type: 'resetKeepingBook' }
  | { type: 'reset' }
```

- [ ] **Step 2: reducer 테스트 작성**

`app/trace/new/_tests/traceDraft.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import { initialTraceDraft, traceDraftReducer } from '../_data/traceDraft.store'
import type { DraftDecoration, SelectedBook } from '../_types/traceDraft.type'

const book: SelectedBook = {
  bookId: 1,
  title: '채식주의자',
  author: '한강',
  coverImageUrl: null,
  pageCount: 268,
}

const decoration = (startOffset: number, endOffset: number): DraftDecoration => ({
  startOffset,
  endOffset,
  effectType: 'HIGHLIGHT',
  color: '#FFE08A',
})

describe('traceDraftReducer', () => {
  it('selectBook은 책을 담는다', () => {
    const next = traceDraftReducer(initialTraceDraft, { type: 'selectBook', book })
    expect(next.book).toEqual(book)
  })

  it('setPageDetail은 페이지와 스포일러를 함께 담는다', () => {
    const next = traceDraftReducer(initialTraceDraft, {
      type: 'setPageDetail',
      pageNumber: 87,
      isSpoiler: true,
    })
    expect(next.pageNumber).toBe(87)
    expect(next.isSpoiler).toBe(true)
  })

  it('applyDecoration은 겹치지 않는 범위를 그대로 추가한다', () => {
    const withFirst = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(0, 5),
    })
    const withSecond = traceDraftReducer(withFirst, {
      type: 'applyDecoration',
      decoration: decoration(10, 15),
    })
    expect(withSecond.decorations).toHaveLength(2)
  })

  it('applyDecoration은 겹치는 기존 범위를 교체한다', () => {
    const withFirst = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(0, 10),
    })
    const withSecond = traceDraftReducer(withFirst, {
      type: 'applyDecoration',
      decoration: decoration(5, 15),
    })
    expect(withSecond.decorations).toEqual([decoration(5, 15)])
  })

  it('경계가 맞닿은 범위는 겹침이 아니다', () => {
    const withFirst = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(0, 5),
    })
    const withSecond = traceDraftReducer(withFirst, {
      type: 'applyDecoration',
      decoration: decoration(5, 10),
    })
    expect(withSecond.decorations).toHaveLength(2)
  })

  it('applyDecoration은 startOffset 오름차순을 유지한다', () => {
    const withLater = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(10, 15),
    })
    const withEarlier = traceDraftReducer(withLater, {
      type: 'applyDecoration',
      decoration: decoration(0, 5),
    })
    expect(withEarlier.decorations.map((d) => d.startOffset)).toEqual([0, 10])
  })

  it('removeDecoration은 startOffset이 일치하는 항목을 지운다', () => {
    const withFirst = traceDraftReducer(initialTraceDraft, {
      type: 'applyDecoration',
      decoration: decoration(0, 5),
    })
    const removed = traceDraftReducer(withFirst, { type: 'removeDecoration', startOffset: 0 })
    expect(removed.decorations).toEqual([])
  })

  it('resetKeepingBook은 책만 남기고 나머지를 비운다', () => {
    const filled = [
      { type: 'selectBook', book } as const,
      { type: 'setQuotedText', quotedText: '어떤 문장' } as const,
      { type: 'setContent', content: '내 의견' } as const,
    ].reduce(traceDraftReducer, initialTraceDraft)

    const next = traceDraftReducer(filled, { type: 'resetKeepingBook' })
    expect(next.book).toEqual(book)
    expect(next.quotedText).toBe('')
    expect(next.content).toBe('')
    expect(next.result).toBeNull()
  })

  it('reset은 전부 비운다', () => {
    const filled = traceDraftReducer(initialTraceDraft, { type: 'selectBook', book })
    expect(traceDraftReducer(filled, { type: 'reset' })).toEqual(initialTraceDraft)
  })
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `pnpm test -- traceDraft`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 4: store 구현**

`app/trace/new/_data/traceDraft.store.ts`

```ts
'use client'

import { createContext, type Dispatch } from 'react'

import type { DraftDecoration, TraceDraft, TraceDraftAction } from '../_types/traceDraft.type'

export const initialTraceDraft: TraceDraft = {
  book: null,
  source: null,
  quotedText: '',
  pageNumber: null,
  isSpoiler: false,
  decorations: [],
  content: '',
  passageId: null,
  result: null,
}

function overlaps(a: DraftDecoration, b: DraftDecoration): boolean {
  return a.startOffset < b.endOffset && b.startOffset < a.endOffset
}

export function traceDraftReducer(state: TraceDraft, action: TraceDraftAction): TraceDraft {
  switch (action.type) {
    case 'selectBook':
      return { ...state, book: action.book }
    case 'setSource':
      return { ...state, source: action.source }
    case 'setQuotedText':
      return { ...state, quotedText: action.quotedText, decorations: [] }
    case 'setPageDetail':
      return { ...state, pageNumber: action.pageNumber, isSpoiler: action.isSpoiler }
    case 'applyDecoration':
      return {
        ...state,
        decorations: [
          ...state.decorations.filter((item) => !overlaps(item, action.decoration)),
          action.decoration,
        ].sort((a, b) => a.startOffset - b.startOffset),
      }
    case 'removeDecoration':
      return {
        ...state,
        decorations: state.decorations.filter((item) => item.startOffset !== action.startOffset),
      }
    case 'setContent':
      return { ...state, content: action.content }
    case 'setMergeTarget':
      return { ...state, passageId: action.passageId }
    case 'setResult':
      return { ...state, result: action.result }
    case 'resetKeepingBook':
      return { ...initialTraceDraft, book: state.book }
    case 'reset':
      return initialTraceDraft
  }
}

export const TraceDraftContext = createContext<{
  draft: TraceDraft
  dispatch: Dispatch<TraceDraftAction>
} | null>(null)
```

`setQuotedText`가 `decorations`를 비우는 이유: 대목이 바뀌면 기존 offset이 전부 무의미해진다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test -- traceDraft`
Expected: PASS (9 tests)

- [ ] **Step 6: Provider와 훅 구현**

`app/trace/new/_components/TraceDraftProvider/TraceDraftProvider.tsx`

```tsx
'use client'

import { type ReactNode, useMemo, useReducer } from 'react'

import {
  initialTraceDraft,
  TraceDraftContext,
  traceDraftReducer,
} from '../../_data/traceDraft.store'

export function TraceDraftProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(traceDraftReducer, initialTraceDraft)
  const value = useMemo(() => ({ draft, dispatch }), [draft])

  return <TraceDraftContext value={value}>{children}</TraceDraftContext>
}
```

React 19에서는 `<Context>`를 Provider로 직접 쓸 수 있다(`<Context.Provider>` 불필요).

`app/trace/new/_hooks/useTraceDraft.ts`

```ts
'use client'

import { use } from 'react'

import { TraceDraftContext } from '../_data/traceDraft.store'

export function useTraceDraft() {
  const value = use(TraceDraftContext)
  if (!value) throw new Error('useTraceDraft는 TraceDraftProvider 안에서만 쓸 수 있습니다.')
  return value
}
```

- [ ] **Step 7: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/trace/new
git commit -m "feat: 흔적 작성 draft 상태와 Provider 추가"
```

---

## Task 8: 라우트 스캐폴딩과 스텝 가드

7개 라우트의 뼈대를 세우고, 새로고침·딥링크로 빈 draft에 떨어지는 경우를 막는다.

**Files:**

- Create: `app/trace/new/layout.tsx`
- Create: `app/trace/new/_services/traceGuard.service.ts`
- Create: `app/trace/new/_components/TraceStepGuard/TraceStepGuard.tsx`
- Create: `app/trace/new/_hooks/useTraceGuard.ts`
- Create: `app/trace/new/page.tsx`
- Create: `app/trace/new/photo/page.tsx`
- Create: `app/trace/new/detail/page.tsx`
- Create: `app/trace/new/decorate/page.tsx`
- Create: `app/trace/new/opinion/page.tsx`
- Create: `app/trace/new/done/page.tsx`
- Test: `app/trace/new/_tests/traceGuard.spec.ts`

**Interfaces:**

- Consumes: Task 7의 `useTraceDraft`, `TraceDraft`
- Produces:
  - `resolveGuardRedirect(pathname: string, draft: TraceDraft): string | null` — 리다이렉트할 경로 또는 통과 시 null. 순수 함수라 단독 테스트 가능.
  - `useTraceGuard(): void` — 위 함수를 pathname과 draft로 호출해 `router.replace`
  - `TraceStepGuard({ children })`

- [ ] **Step 1: 가드 로직 테스트 작성**

`app/trace/new/_tests/traceGuard.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import { resolveGuardRedirect } from '../_services/traceGuard.service'
import { initialTraceDraft } from '../_data/traceDraft.store'
import type { SelectedBook, TraceDraft } from '../_types/traceDraft.type'

const book: SelectedBook = {
  bookId: 1,
  title: '채식주의자',
  author: '한강',
  coverImageUrl: null,
  pageCount: 268,
}

const draftWith = (overrides: Partial<TraceDraft>): TraceDraft => ({
  ...initialTraceDraft,
  ...overrides,
})

describe('resolveGuardRedirect', () => {
  it('책 선택 화면은 언제나 통과한다', () => {
    expect(resolveGuardRedirect('/trace/new', initialTraceDraft)).toBeNull()
  })

  it('책 없이 photo에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/photo', initialTraceDraft)).toBe('/trace/new')
  })

  it('대목 없이 detail에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/detail', draftWith({ book }))).toBe('/trace/new')
  })

  it('대목이 있으면 detail을 통과한다', () => {
    expect(
      resolveGuardRedirect('/trace/new/detail', draftWith({ book, quotedText: '문장' })),
    ).toBeNull()
  })

  it('페이지 없이 decorate에 들어오면 detail로 되돌린다', () => {
    expect(
      resolveGuardRedirect('/trace/new/decorate', draftWith({ book, quotedText: '문장' })),
    ).toBe('/trace/new/detail')
  })

  it('효과 없이 opinion에 들어오면 decorate로 되돌린다', () => {
    expect(
      resolveGuardRedirect(
        '/trace/new/opinion',
        draftWith({ book, quotedText: '문장', pageNumber: 87 }),
      ),
    ).toBe('/trace/new/decorate')
  })

  it('결과 없이 done에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/done', draftWith({ book }))).toBe('/trace/new')
  })

  it('결과가 있으면 done을 통과한다', () => {
    expect(
      resolveGuardRedirect(
        '/trace/new/done',
        draftWith({ result: { opinionId: 1, merged: false } }),
      ),
    ).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- traceGuard`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 3: 가드 서비스 구현**

`app/trace/new/_services/traceGuard.service.ts`

```ts
import type { TraceDraft } from '../_types/traceDraft.type'

const START = '/trace/new'

export function resolveGuardRedirect(pathname: string, draft: TraceDraft): string | null {
  if (pathname === `${START}/done`) {
    return draft.result ? null : START
  }
  if (pathname === `${START}/photo`) {
    return draft.book ? null : START
  }
  if (pathname === `${START}/detail`) {
    return draft.book && draft.quotedText ? null : START
  }
  if (pathname === `${START}/decorate`) {
    if (!draft.book || !draft.quotedText) return START
    return draft.pageNumber === null ? `${START}/detail` : null
  }
  if (pathname === `${START}/opinion`) {
    if (!draft.book || !draft.quotedText) return START
    if (draft.pageNumber === null) return `${START}/detail`
    return draft.decorations.length > 0 ? null : `${START}/decorate`
  }
  return null
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- traceGuard`
Expected: PASS (8 tests)

- [ ] **Step 5: 가드 훅과 래퍼 구현**

`app/trace/new/_hooks/useTraceGuard.ts`

```ts
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { resolveGuardRedirect } from '../_services/traceGuard.service'
import { useTraceDraft } from './useTraceDraft'

export function useTraceGuard(): void {
  const pathname = usePathname()
  const router = useRouter()
  const { draft } = useTraceDraft()

  useEffect(() => {
    const redirect = resolveGuardRedirect(pathname, draft)
    if (redirect) router.replace(redirect)
  }, [pathname, draft, router])
}
```

`app/trace/new/_components/TraceStepGuard/TraceStepGuard.tsx`

```tsx
'use client'

import type { ReactNode } from 'react'

import { useTraceGuard } from '../../_hooks/useTraceGuard'

export function TraceStepGuard({ children }: { children: ReactNode }) {
  useTraceGuard()
  return children
}
```

- [ ] **Step 6: layout과 7개 페이지 뼈대 작성**

`app/trace/new/layout.tsx`

```tsx
import type { ReactNode } from 'react'

import { TraceDraftProvider } from './_components/TraceDraftProvider/TraceDraftProvider'
import { TraceStepGuard } from './_components/TraceStepGuard/TraceStepGuard'

export default function TraceNewLayout({ children }: { children: ReactNode }) {
  return (
    <TraceDraftProvider>
      <TraceStepGuard>{children}</TraceStepGuard>
    </TraceDraftProvider>
  )
}
```

7개 `page.tsx`는 각각 자리표시 마크업만 둔다. 예: `app/trace/new/detail/page.tsx`

```tsx
export default function TraceDetailPage() {
  return <div className="flex flex-1 flex-col bg-bg-dark" />
}
```

`page.tsx`와 `layout.tsx`는 default export가 필수이며 lint 예외 목록에 이미 들어 있다.

- [ ] **Step 7: 라우트가 뜨는지 확인**

Run: `pnpm build`
Expected: 빌드 성공. 출력의 라우트 목록에 `/trace/new`, `/trace/new/detail` 등 7개가 보인다.

- [ ] **Step 8: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/trace/new
git commit -m "feat: 흔적 작성 라우트 뼈대와 스텝 가드 추가"
```

---

## Task 9: `_queries` 추가

생성 함수를 queryOptions/mutationOptions로 감싼다. `_queries`는 `useQuery`/`useMutation`을 호출하지 않는다.

**Files:**

- Modify: `app/_global/_queries/book.queries.ts`
- Create: `app/_global/_queries/passage.queries.ts`
- Create: `app/_global/_queries/opinion.queries.ts`

**Interfaces:**

- Consumes: Task 1의 생성 함수 `getRecentBooks` · `searchInternalBooks` · `createOcrResult` · `checkSimilarPassages` · `createOpinion`
- Produces:
  - `bookQueries.recent(params?: GetRecentBooksParams)`
  - `bookQueries.internalSearch(params: SearchInternalBooksParams)` — `keyword`가 공백뿐이면 `enabled: false`
  - `passageMutations.ocr()` — `mutationFn: createOcrResult`, 인자는 `{ image: Blob }`
  - `passageMutations.similarCheck()` — `mutationFn: checkSimilarPassages`, 인자는 `SimilarCheck`
  - `opinionMutations.create()` — `mutationFn: createOpinion`, 인자는 `CreateOpinionRequest`

- [ ] **Step 1: book.queries.ts에 두 개 추가**

`app/_global/_queries/book.queries.ts`의 `bookQueries` 객체에 추가하고 import를 보강한다.

```ts
import { queryOptions } from '@tanstack/react-query'

import {
  getHomeCarouselBooks,
  getRecentBooks,
  searchInternalBooks,
} from '../_apis/_generated/book/book'
import type { GetRecentBooksParams } from '../_apis/_generated/models/getRecentBooksParams'
import type { SearchInternalBooksParams } from '../_apis/_generated/models/searchInternalBooksParams'

export const bookQueries = {
  all: () => ['book'] as const,
  homeCarousel: () =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'home-carousel'],
      queryFn: () => getHomeCarouselBooks(),
    }),
  recent: (params?: GetRecentBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'recent', params ?? {}],
      queryFn: () => getRecentBooks(params),
    }),
  internalSearch: (params: SearchInternalBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'internal-search', params],
      queryFn: () => searchInternalBooks(params),
      enabled: params.keyword.trim().length > 0,
    }),
}
```

- [ ] **Step 2: passage.queries.ts 작성**

`app/_global/_queries/passage.queries.ts`

```ts
import { mutationOptions } from '@tanstack/react-query'

import { checkSimilarPassages, createOcrResult } from '../_apis/_generated/passage/passage'

export const passageMutations = {
  all: () => ['passage'] as const,
  ocr: () =>
    mutationOptions({
      mutationKey: [...passageMutations.all(), 'ocr'],
      mutationFn: createOcrResult,
    }),
  similarCheck: () =>
    mutationOptions({
      mutationKey: [...passageMutations.all(), 'similar-check'],
      mutationFn: checkSimilarPassages,
    }),
}
```

- [ ] **Step 3: opinion.queries.ts 작성**

`app/_global/_queries/opinion.queries.ts`

```ts
import { mutationOptions } from '@tanstack/react-query'

import { createOpinion } from '../_apis/_generated/opinion/opinion'

export const opinionMutations = {
  all: () => ['opinion'] as const,
  create: () =>
    mutationOptions({
      mutationKey: [...opinionMutations.all(), 'create'],
      mutationFn: createOpinion,
    }),
}
```

- [ ] **Step 4: 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS. `mutationOptions`는 `@tanstack/react-query` 5.101.4에서 export된다.

- [ ] **Step 5: 커밋**

```bash
git add app/_global/_queries
git commit -m "feat: 도서·대목·흔적 쿼리 옵션 추가"
```

---

## Task 10: 책 선택 화면

`/trace/new`. 최근 도서 목록과 내부 검색, 그리고 저장 방식 BottomSheet 두 개를 연결한다.

**Files:**

- Modify: `app/trace/new/page.tsx`
- Create: `app/trace/new/_components/BookPickList/BookPickList.tsx`
- Create: `app/trace/new/_components/BookPicker/BookPicker.tsx`
- Create: `app/trace/new/_components/TraceSourceSheet/TraceSourceSheet.tsx`
- Create: `app/trace/new/_components/ManualQuoteSheet/ManualQuoteSheet.tsx`

**Interfaces:**

- Consumes: Task 4 `BottomSheet`, Task 7 `useTraceDraft`, Task 9 `bookQueries`
- Produces:
  - `BookPickList({ books, onSelect })` — `books`는 `BookResponse[]`
  - `TraceSourceSheet({ open, onClose, onSelectPhoto, onSelectManual })`
  - `ManualQuoteSheet({ open, onClose, onSubmit })` — `onSubmit(quotedText: string)`
  - `BookPicker()` — 화면 전체 로직을 담는 클라이언트 컴포넌트. `page.tsx`는 이걸 렌더만 한다.

- [ ] **Step 1: BookPickList 구현**

`app/trace/new/_components/BookPickList/BookPickList.tsx`

생성된 `BookResponse`를 import하면 `_apis` 금지 규칙에 걸리므로 필요한 필드만 로컬 타입으로 좁혀 정의한다.

```tsx
'use client'

type PickableBook = {
  bookId: number
  title: string
  author: string
  coverImageUrl?: string | null
  pageCount?: number | null
}

type BookPickListProps = {
  books: PickableBook[]
  onSelect: (book: PickableBook) => void
}

export function BookPickList({ books, onSelect }: BookPickListProps) {
  if (books.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-body-14md text-text-inverse opacity-60">
        아직 흔적을 남긴 책이 없어요.
      </p>
    )
  }

  return (
    <ul className="flex flex-col">
      {books.map((book) => (
        <li key={book.bookId}>
          <button
            type="button"
            onClick={() => {
              onSelect(book)
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left"
          >
            {book.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
              <img
                src={book.coverImageUrl}
                alt=""
                className="h-16 w-11 shrink-0 rounded-[2px] object-cover"
              />
            ) : (
              <span className="h-16 w-11 shrink-0 rounded-[2px] bg-bg-gray" />
            )}
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-title-16sb text-text-inverse">{book.title}</span>
              <span className="truncate text-body-14rg text-text-inverse opacity-60">
                {book.author}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: 두 BottomSheet 구현**

`app/trace/new/_components/TraceSourceSheet/TraceSourceSheet.tsx`

```tsx
'use client'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import CameraIcon from '@/app/_global/_components/Icon/assets/camera.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'

type TraceSourceSheetProps = {
  open: boolean
  onClose: () => void
  onSelectPhoto: () => void
  onSelectManual: () => void
}

export function TraceSourceSheet({
  open,
  onClose,
  onSelectPhoto,
  onSelectManual,
}: TraceSourceSheetProps) {
  return (
    <BottomSheet open={open} title="새로운 흔적을 어떻게 남길까요?" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSelectPhoto}
          className="flex flex-col gap-2 rounded-lg bg-bg-surface p-4 text-left"
        >
          <span className="text-title-16sb text-text-primary">사진으로 입력</span>
          <span className="text-body-14rg text-text-tertiary">책 사진을 찍어 문장을 인식해요</span>
          <CameraIcon aria-hidden="true" className="size-6 self-end" />
        </button>
        <button
          type="button"
          onClick={onSelectManual}
          className="flex flex-col gap-2 rounded-lg bg-bg-surface p-4 text-left"
        >
          <span className="text-title-16sb text-text-primary">직접 입력</span>
          <span className="text-body-14rg text-text-tertiary">문장을 손으로 타이핑해요</span>
          <PencilIcon aria-hidden="true" className="size-6 self-end" />
        </button>
      </div>
    </BottomSheet>
  )
}
```

`app/trace/new/_components/ManualQuoteSheet/ManualQuoteSheet.tsx`

```tsx
'use client'

import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'

type ManualQuoteSheetProps = {
  open: boolean
  onClose: () => void
  onSubmit: (quotedText: string) => void
}

export function ManualQuoteSheet({ open, onClose, onSubmit }: ManualQuoteSheetProps) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()

  return (
    <BottomSheet open={open} title="직접 입력" onClose={onClose}>
      <Textarea
        value={value}
        maxLength={150}
        placeholder="문장을 입력해주세요."
        onChange={(event) => {
          setValue(event.target.value)
        }}
      />
      <Button
        variant="activated"
        disabled={trimmed.length === 0}
        onClick={() => {
          onSubmit(trimmed)
        }}
      >
        다음
      </Button>
    </BottomSheet>
  )
}
```

- [ ] **Step 3: BookPicker 구현**

`app/trace/new/_components/BookPicker/BookPicker.tsx`

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useDeferredValue, useEffect, useState } from 'react'

import { bookQueries } from '@/app/_global/_queries/book.queries'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { BookPickList } from '../BookPickList/BookPickList'
import { ManualQuoteSheet } from '../ManualQuoteSheet/ManualQuoteSheet'
import { TraceSourceSheet } from '../TraceSourceSheet/TraceSourceSheet'

export function BookPicker() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [keyword, setKeyword] = useState('')
  const [sheet, setSheet] = useState<'none' | 'source' | 'manual'>('none')
  const deferredKeyword = useDeferredValue(keyword)

  const recent = useQuery(bookQueries.recent())
  const searched = useQuery(bookQueries.internalSearch({ keyword: deferredKeyword }))

  // 완료 화면에서 '흔적 남기기'로 돌아오면 책이 유지된 채 진입한다. 바로 방식 선택을 띄운다.
  useEffect(() => {
    if (draft.book && !draft.quotedText) setSheet('source')
  }, [draft.book, draft.quotedText])

  const books =
    deferredKeyword.trim().length > 0
      ? (searched.data?.data.books ?? [])
      : (recent.data?.data.books ?? [])

  return (
    <div className="flex flex-1 flex-col bg-bg-dark">
      <input
        type="search"
        value={keyword}
        placeholder="책 제목으로 검색"
        aria-label="책 검색"
        onChange={(event) => {
          setKeyword(event.target.value)
        }}
        className="mx-4 mt-4 rounded-lg bg-bg-gray px-4 py-3 text-body-16rg text-text-inverse outline-none placeholder:opacity-50"
      />
      <BookPickList
        books={books}
        onSelect={(book) => {
          dispatch({
            type: 'selectBook',
            book: {
              bookId: book.bookId,
              title: book.title,
              author: book.author,
              coverImageUrl: book.coverImageUrl ?? null,
              pageCount: book.pageCount ?? null,
            },
          })
          setSheet('source')
        }}
      />
      <TraceSourceSheet
        open={sheet === 'source'}
        onClose={() => {
          setSheet('none')
        }}
        onSelectPhoto={() => {
          dispatch({ type: 'setSource', source: 'photo' })
          setSheet('none')
          router.push('/trace/new/photo')
        }}
        onSelectManual={() => {
          dispatch({ type: 'setSource', source: 'manual' })
          setSheet('manual')
        }}
      />
      <ManualQuoteSheet
        open={sheet === 'manual'}
        onClose={() => {
          setSheet('none')
        }}
        onSubmit={(quotedText) => {
          dispatch({ type: 'setQuotedText', quotedText })
          setSheet('none')
          router.push('/trace/new/detail')
        }}
      />
    </div>
  )
}
```

`recent.data`의 형태는 `DataResponseBookListResponse` = `{ data: { books, pageInfo } }`다. 실제 생성 타입을 열어 확인하고 접근 경로를 맞춘다.

- [ ] **Step 4: page.tsx 연결**

`app/trace/new/page.tsx`

```tsx
import { BookPicker } from './_components/BookPicker/BookPicker'

export default function TraceNewPage() {
  return <BookPicker />
}
```

- [ ] **Step 5: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/trace/new
git commit -m "feat: 흔적 작성 진입 화면과 저장 방식 선택 시트 추가"
```

---

## Task 11: 효과 분할 서비스와 TraceNote

`decorations`가 문자 오프셋 범위라 `quotedText`를 경계마다 잘라 조각별로 스타일을 입힌다. 렌더링 로직을 순수 함수로 분리해 단독 테스트한다.

**Files:**

- Create: `app/trace/new/_data/effect.constant.ts`
- Create: `app/trace/new/_services/decoration.service.ts`
- Create: `app/trace/new/_components/TraceNote/TraceNote.tsx`
- Create: `app/trace/new/_components/TraceNote/TraceNote.stories.tsx`
- Test: `app/trace/new/_tests/decoration.spec.ts`

**Interfaces:**

- Consumes: Task 7의 `DraftDecoration`, `DraftEffectType`
- Produces:
  - `EFFECT_OPTIONS: readonly EffectOption[]` — `{ key, label, effectType: DraftEffectType | null, color }`. `effectType`이 null이면 비활성.
  - `splitByDecorations(text: string, decorations: DraftDecoration[]): TextSegment[]` — `TextSegment = { text: string; decoration: DraftDecoration | null }`
  - `TraceNote({ quotedText, decorations, children })` — `children`은 선택 오버레이를 끼우기 위한 슬롯. 없으면 분할 렌더만 한다.

- [ ] **Step 1: 분할 함수 테스트 작성**

`app/trace/new/_tests/decoration.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import { splitByDecorations } from '../_services/decoration.service'
import type { DraftDecoration } from '../_types/traceDraft.type'

const deco = (startOffset: number, endOffset: number): DraftDecoration => ({
  startOffset,
  endOffset,
  effectType: 'HIGHLIGHT',
  color: '#FFE08A',
})

describe('splitByDecorations', () => {
  it('효과가 없으면 통째로 한 조각이다', () => {
    expect(splitByDecorations('안녕하세요', [])).toEqual([{ text: '안녕하세요', decoration: null }])
  })

  it('빈 문자열은 빈 배열이다', () => {
    expect(splitByDecorations('', [])).toEqual([])
  })

  it('가운데 범위를 앞·효과·뒤 세 조각으로 나눈다', () => {
    expect(splitByDecorations('안녕하세요', [deco(1, 3)])).toEqual([
      { text: '안', decoration: null },
      { text: '녕하', decoration: deco(1, 3) },
      { text: '세요', decoration: null },
    ])
  })

  it('맨 앞부터 시작하면 앞 조각이 생기지 않는다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 2)])).toEqual([
      { text: '안녕', decoration: deco(0, 2) },
      { text: '하세요', decoration: null },
    ])
  })

  it('끝까지 덮으면 뒤 조각이 생기지 않는다', () => {
    expect(splitByDecorations('안녕', [deco(0, 2)])).toEqual([
      { text: '안녕', decoration: deco(0, 2) },
    ])
  })

  it('맞닿은 두 범위 사이에는 빈 조각이 없다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 2), deco(2, 4)])).toEqual([
      { text: '안녕', decoration: deco(0, 2) },
      { text: '하세', decoration: deco(2, 4) },
      { text: '요', decoration: null },
    ])
  })

  it('정렬되지 않은 입력도 위치순으로 처리한다', () => {
    expect(splitByDecorations('안녕하세요', [deco(3, 5), deco(0, 1)])).toEqual([
      { text: '안', decoration: deco(0, 1) },
      { text: '녕하', decoration: null },
      { text: '세요', decoration: deco(3, 5) },
    ])
  })

  it('앞 조각과 겹치는 항목은 건너뛴다', () => {
    expect(splitByDecorations('안녕하세요', [deco(0, 3), deco(2, 5)])).toEqual([
      { text: '안녕하', decoration: deco(0, 3) },
      { text: '세요', decoration: null },
    ])
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- decoration`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 3: 분할 함수 구현**

`app/trace/new/_services/decoration.service.ts`

```ts
import type { DraftDecoration } from '../_types/traceDraft.type'

export type TextSegment = { text: string; decoration: DraftDecoration | null }

export function splitByDecorations(text: string, decorations: DraftDecoration[]): TextSegment[] {
  const segments: TextSegment[] = []
  const sorted = [...decorations].sort((a, b) => a.startOffset - b.startOffset)
  let cursor = 0

  for (const decoration of sorted) {
    // 겹침은 입력 단계에서 제거되지만 방어적으로 건너뛴다.
    if (decoration.startOffset < cursor) continue
    if (decoration.startOffset > cursor) {
      segments.push({ text: text.slice(cursor, decoration.startOffset), decoration: null })
    }
    segments.push({ text: text.slice(decoration.startOffset, decoration.endOffset), decoration })
    cursor = decoration.endOffset
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), decoration: null })
  }
  return segments
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- decoration`
Expected: PASS (8 tests)

- [ ] **Step 5: 효과 상수 작성**

`app/trace/new/_data/effect.constant.ts`

```ts
import type { DraftEffectType } from '../_types/traceDraft.type'

export type EffectOption = {
  key: string
  label: string
  /** null이면 API effectType enum에 대응 값이 없어 비활성이다. */
  effectType: DraftEffectType | null
  color: string
}

// 시안의 3×2 그리드 순서를 유지한다. 백엔드가 enum을 넓히면 effectType만 채우면 열린다.
export const EFFECT_OPTIONS: readonly EffectOption[] = [
  { key: 'highlight', label: '형광펜', effectType: 'HIGHLIGHT', color: '#FFE08A' },
  { key: 'wavy', label: '물결줄', effectType: 'WAVY', color: '#EF5A06' },
  { key: 'circle', label: '동그라미', effectType: null, color: '#EF5A06' },
  { key: 'pencil', label: '색연필', effectType: 'UNDERLINE', color: '#EF5A06' },
  { key: 'dotted', label: '점선', effectType: null, color: '#EF5A06' },
  { key: 'double', label: '겹줄', effectType: null, color: '#EF5A06' },
]
```

- [ ] **Step 6: TraceNote 구현**

`app/trace/new/_components/TraceNote/TraceNote.tsx`

```tsx
import type { ReactNode } from 'react'

import { splitByDecorations } from '../../_services/decoration.service'
import type { DraftDecoration, DraftEffectType } from '../../_types/traceDraft.type'

type TraceNoteProps = {
  quotedText: string
  decorations: DraftDecoration[]
  children?: ReactNode
}

const effectClassMap: Record<DraftEffectType, string> = {
  HIGHLIGHT: 'rounded-[2px] px-0.5',
  WAVY: 'underline decoration-wavy decoration-2 underline-offset-4',
  UNDERLINE: 'underline decoration-2 underline-offset-4',
}

export function TraceNote({ quotedText, decorations, children }: TraceNoteProps) {
  return (
    <div className="relative rounded-[4px] border border-border-book bg-bg-book-card px-6 py-8 drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]">
      <p className="text-body-20md whitespace-pre-wrap text-text-secondary">
        {splitByDecorations(quotedText, decorations).map((segment, index) =>
          segment.decoration ? (
            <span
              key={index}
              className={effectClassMap[segment.decoration.effectType]}
              style={
                segment.decoration.effectType === 'HIGHLIGHT'
                  ? { backgroundColor: segment.decoration.color }
                  : { textDecorationColor: segment.decoration.color }
              }
            >
              {segment.text}
            </span>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </p>
      {children}
    </div>
  )
}
```

`key={index}`는 조각이 위치로만 식별되고 재정렬되지 않아 안전하다.

- [ ] **Step 7: 스토리 작성 후 커밋**

`app/trace/new/_components/TraceNote/TraceNote.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TraceNote } from './TraceNote'

const QUOTE =
  '지금도 초밥 집 주인장의 얼굴은 그릴 수 있을 만큼 정확히 떠오르는 걸 보면 그 때 초밥이 어지간히도 맛없어서 저에게 추위와 고통을 안겨줬던 모양입니다.'

const meta = {
  title: 'Trace/TraceNote',
  component: TraceNote,
  args: {
    quotedText: QUOTE,
    decorations: [],
  },
  decorators: [
    (Story) => (
      <div className="w-[311px] bg-bg-dark p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TraceNote>

export default meta

type Story = StoryObj<typeof meta>

export const NoEffect: Story = {}

export const Highlight: Story = {
  args: {
    decorations: [{ startOffset: 0, endOffset: 6, effectType: 'HIGHLIGHT', color: '#FFE08A' }],
  },
}

export const MixedEffects: Story = {
  args: {
    decorations: [
      { startOffset: 0, endOffset: 6, effectType: 'HIGHLIGHT', color: '#FFE08A' },
      { startOffset: 10, endOffset: 16, effectType: 'WAVY', color: '#EF5A06' },
      { startOffset: 20, endOffset: 26, effectType: 'UNDERLINE', color: '#EF5A06' },
    ],
  },
}
```

route-local 컴포넌트라 상대경로 import를 쓴다(`_global` 컴포넌트만 `@/` 절대경로).

Run: `pnpm lint && pnpm typecheck && pnpm test`

```bash
git add app/trace/new
git commit -m "feat: 대목 카드와 효과 분할 렌더링 추가"
```

---

## Task 12: TextRangeSelector

네이티브 `window.getSelection()`은 모바일 웹뷰에서 파란 핸들과 복사 메뉴가 함께 떠 시안과 맞지 않는다. 포인터 이벤트로 직접 구현한다.

**Files:**

- Create: `app/trace/new/_services/textRange.service.ts`
- Create: `app/trace/new/_components/TextRangeSelector/TextRangeSelector.tsx`
- Create: `app/trace/new/_hooks/useTextRangeSelection.ts`
- Test: `app/trace/new/_tests/textRangeSelection.spec.ts`

**Interfaces:**

- Produces:
  - `useTextRangeSelection(onSelect: (range: { startOffset: number; endOffset: number }) => void)` — `{ range, handlers }` 반환. `handlers`는 `{ onPointerDown, onPointerMove, onPointerUp }`. `range`는 드래그 중인 미확정 범위(`null` 가능).
  - `TextRangeSelector({ text, selection, onSelect })` — 글자마다 `<span data-offset>`을 렌더하고 드래그를 처리한다.
- 확정된 `endOffset`은 **exclusive**다. 마지막으로 지나간 글자의 인덱스 + 1.

- [ ] **Step 1: 선택 계산 테스트 작성**

좌표 처리는 DOM에 의존하므로, offset 두 개를 정규화하는 순수 함수만 단독 테스트한다.

`app/trace/new/_tests/textRangeSelection.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import { normalizeRange } from '../_services/textRange.service'

describe('normalizeRange', () => {
  it('앞에서 뒤로 드래그하면 endOffset이 exclusive가 된다', () => {
    expect(normalizeRange(1, 3)).toEqual({ startOffset: 1, endOffset: 4 })
  })

  it('뒤에서 앞으로 드래그해도 같은 범위가 된다', () => {
    expect(normalizeRange(3, 1)).toEqual({ startOffset: 1, endOffset: 4 })
  })

  it('한 글자만 눌러도 길이 1인 범위가 된다', () => {
    expect(normalizeRange(2, 2)).toEqual({ startOffset: 2, endOffset: 3 })
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- textRangeSelection`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 3: 정규화 함수 구현**

`app/trace/new/_services/textRange.service.ts`

```ts
export type TextRange = { startOffset: number; endOffset: number }

/** anchor와 focus는 모두 글자 인덱스(inclusive)다. 결과의 endOffset은 exclusive다. */
export function normalizeRange(anchor: number, focus: number): TextRange {
  const start = Math.min(anchor, focus)
  const end = Math.max(anchor, focus)
  return { startOffset: start, endOffset: end + 1 }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- textRangeSelection`
Expected: PASS (3 tests)

- [ ] **Step 5: 훅과 컴포넌트 구현**

`app/trace/new/_hooks/useTextRangeSelection.ts`

```ts
'use client'

import { type PointerEvent, useState } from 'react'

import { normalizeRange, type TextRange } from '../_services/textRange.service'

function offsetFromPoint(x: number, y: number): number | null {
  const element = document.elementFromPoint(x, y)
  const raw = element?.getAttribute('data-offset')
  return raw === null || raw === undefined ? null : Number(raw)
}

export function useTextRangeSelection(onSelect: (range: TextRange) => void) {
  const [anchor, setAnchor] = useState<number | null>(null)
  const [range, setRange] = useState<TextRange | null>(null)

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset === null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setAnchor(offset)
    setRange(normalizeRange(offset, offset))
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (anchor === null) return
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset === null) return
    setRange(normalizeRange(anchor, offset))
  }

  const onPointerUp = () => {
    if (range) onSelect(range)
    setAnchor(null)
  }

  return { range, handlers: { onPointerDown, onPointerMove, onPointerUp } }
}
```

`app/trace/new/_components/TextRangeSelector/TextRangeSelector.tsx`

```tsx
'use client'

import { cn } from '@/app/_global/_services/cn.service'

import { useTextRangeSelection } from '../../_hooks/useTextRangeSelection'
import type { TextRange } from '../../_services/textRange.service'

type TextRangeSelectorProps = {
  text: string
  onSelect: (range: TextRange) => void
}

export function TextRangeSelector({ text, onSelect }: TextRangeSelectorProps) {
  const { range, handlers } = useTextRangeSelection(onSelect)

  return (
    <p
      {...handlers}
      className="text-body-20md whitespace-pre-wrap touch-none select-none text-text-secondary"
    >
      {Array.from(text).map((char, index) => (
        <span
          key={index}
          data-offset={index}
          className={cn(
            range && index >= range.startOffset && index < range.endOffset && 'bg-orange-200',
          )}
        >
          {char}
        </span>
      ))}
    </p>
  )
}
```

`Array.from(text)`의 인덱스는 code point 기준이라 서로게이트 페어가 있으면 `slice`의 code unit 인덱스와 어긋난다. 대목은 책 인용문이라 발생 가능성이 낮다고 보고 다루지 않는다(스펙 §7).

- [ ] **Step 6: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/trace/new
git commit -m "feat: 포인터 드래그 기반 문자 범위 선택 추가"
```

---

## Task 13: 1/3 페이지·스포일러 화면

**Files:**

- Modify: `app/trace/new/detail/page.tsx`
- Create: `app/trace/new/_components/TraceStepHeader/TraceStepHeader.tsx`
- Create: `app/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx`

**Interfaces:**

- Consumes: Task 6 `SegmentedControl`, Task 11 `TraceNote`, Task 7 `useTraceDraft`
- Produces:
  - `TraceStepHeader({ step, title })` — `step`은 1~3. `1/3` 표기와 닫기 버튼(→ `/`)을 그린다.
  - `TraceDetailForm()`

- [ ] **Step 1: 스텝 헤더 구현**

`app/trace/new/_components/TraceStepHeader/TraceStepHeader.tsx`

```tsx
'use client'

import { useRouter } from 'next/navigation'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'

type TraceStepHeaderProps = {
  step: 1 | 2 | 3
  title: string
}

export function TraceStepHeader({ step, title }: TraceStepHeaderProps) {
  const router = useRouter()

  return (
    <header className="flex flex-col gap-6 px-4 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-body-16md text-text-primary">{step}/3</span>
        <button
          type="button"
          aria-label="닫기"
          onClick={() => {
            router.push('/')
          }}
          className="flex size-6 items-center justify-center text-icon-primary"
        >
          <CloseIcon aria-hidden="true" className="size-6" />
        </button>
      </div>
      <h1 className="whitespace-pre-line text-title-20sb text-text-primary">{title}</h1>
    </header>
  )
}
```

- [ ] **Step 2: 폼 구현**

`app/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx`

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { SegmentedControl } from '@/app/_global/_components/SegmentedControl/SegmentedControl'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepHeader } from '../TraceStepHeader/TraceStepHeader'

const SPOILER_OPTIONS = [
  { value: 'no', label: '없어요' },
  { value: 'yes', label: '있어요' },
] as const

export function TraceDetailForm() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [page, setPage] = useState('')
  const [spoiler, setSpoiler] = useState('no')

  const pageNumber = Number(page)
  const maxPage = draft.book?.pageCount ?? null
  const isValidPage =
    page.length > 0 &&
    Number.isInteger(pageNumber) &&
    pageNumber > 0 &&
    (maxPage === null || pageNumber <= maxPage)

  return (
    <div className="flex flex-1 flex-col bg-bg-dark">
      <div className="bg-bg-alternative pb-6">
        <TraceStepHeader step={1} title={'문장이 있는 페이지와\n스포일러 유무를 선택해주세요'} />
      </div>
      <div className="-mt-4 px-8">
        <TraceNote quotedText={draft.quotedText} decorations={[]} />
      </div>

      <div className="flex flex-col gap-6 px-4 pt-8">
        <label className="flex flex-col gap-2">
          <span className="text-body-14md text-text-inverse">페이지</span>
          <span className="flex items-center gap-2 rounded-lg border border-white-a20 px-4 py-3">
            <input
              inputMode="numeric"
              value={page}
              placeholder="000"
              onChange={(event) => {
                setPage(event.target.value.replace(/[^0-9]/g, ''))
              }}
              className="min-w-0 flex-1 bg-transparent text-body-16rg text-text-inverse outline-none placeholder:opacity-40"
            />
            <span className="text-body-16rg text-text-inverse opacity-60">P</span>
          </span>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-body-14md text-text-inverse">스포일러</span>
          <SegmentedControl
            label="스포일러"
            options={SPOILER_OPTIONS}
            value={spoiler}
            onChange={setSpoiler}
          />
        </div>
      </div>

      <div className="mt-auto flex gap-2 px-4 pb-4">
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            router.back()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="flex-1"
          disabled={!isValidPage}
          onClick={() => {
            dispatch({ type: 'setPageDetail', pageNumber, isSpoiler: spoiler === 'yes' })
            router.push('/trace/new/decorate')
          }}
        >
          다음
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: page.tsx 연결**

```tsx
import { TraceDetailForm } from '../_components/TraceDetailForm/TraceDetailForm'

export default function TraceDetailPage() {
  return <TraceDetailForm />
}
```

- [ ] **Step 4: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/trace/new
git commit -m "feat: 페이지·스포일러 입력 화면 추가"
```

---

## Task 14: 2/3 꾸미기 화면

**Files:**

- Modify: `app/trace/new/decorate/page.tsx`
- Create: `app/trace/new/_components/EffectPicker/EffectPicker.tsx`
- Create: `app/trace/new/_components/EffectPicker/EffectPicker.stories.tsx`
- Create: `app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx`

**Interfaces:**

- Consumes: Task 11 `EFFECT_OPTIONS`·`TraceNote`, Task 12 `TextRangeSelector`, Task 5 `Snackbar`
- Produces:
  - `EffectPicker({ onPick, disabled })` — `onPick(option: EffectOption)`. `effectType`이 null인 항목은 항상 비활성.
  - `TraceDecorateForm()` — 병합 호출은 Task 15에서 붙인다. 지금은 `다음`이 곧장 `/trace/new/opinion`으로 간다.

- [ ] **Step 1: EffectPicker 구현**

`app/trace/new/_components/EffectPicker/EffectPicker.tsx`

```tsx
'use client'

import { cn } from '@/app/_global/_services/cn.service'

import { EFFECT_OPTIONS, type EffectOption } from '../../_data/effect.constant'

type EffectPickerProps = {
  onPick: (option: EffectOption) => void
  disabled: boolean
}

export function EffectPicker({ onPick, disabled }: EffectPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {EFFECT_OPTIONS.map((option) => {
        const isDisabled = disabled || option.effectType === null
        return (
          <button
            key={option.key}
            type="button"
            disabled={isDisabled}
            onClick={() => {
              onPick(option)
            }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg bg-bg-gray py-4 text-caption-12rg text-text-inverse',
              isDisabled && 'opacity-40',
            )}
          >
            <span aria-hidden="true" className="text-title-18sb" style={{ color: option.color }}>
              A
            </span>
            <span>{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 1-1: EffectPicker 스토리 작성**

`app/trace/new/_components/EffectPicker/EffectPicker.stories.tsx`

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { EffectPicker } from './EffectPicker'

const meta = {
  title: 'Trace/EffectPicker',
  component: EffectPicker,
  args: {
    onPick: () => undefined,
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div className="w-[343px] bg-bg-dark p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EffectPicker>

export default meta

type Story = StoryObj<typeof meta>

/** 형광펜·물결줄·색연필만 활성. 동그라미·점선·겹줄은 API enum에 대응 값이 없어 항상 비활성이다. */
export const Default: Story = {}

export const AllDisabled: Story = {
  args: { disabled: true },
}
```

- [ ] **Step 2: 꾸미기 폼 구현**

`app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx`

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'

import type { EffectOption } from '../../_data/effect.constant'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import type { TextRange } from '../../_services/textRange.service'
import { EffectPicker } from '../EffectPicker/EffectPicker'
import { TextRangeSelector } from '../TextRangeSelector/TextRangeSelector'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepHeader } from '../TraceStepHeader/TraceStepHeader'

export function TraceDecorateForm() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [range, setRange] = useState<TextRange | null>(null)
  const [message, setMessage] = useState('')

  const handlePick = (option: EffectOption) => {
    if (!range || !option.effectType) {
      setMessage('영역 선택 후 효과를 입력해주세요!')
      return
    }
    dispatch({
      type: 'applyDecoration',
      decoration: { ...range, effectType: option.effectType, color: option.color },
    })
    setRange(null)
  }

  return (
    <div className="relative flex flex-1 flex-col bg-bg-dark">
      <div className="bg-bg-alternative pb-6">
        <TraceStepHeader step={2} title={'원하는 영역을 선택하고\n다양한 효과를 적용해보세요'} />
      </div>
      <div className="-mt-4 px-8">
        <TraceNote quotedText={draft.quotedText} decorations={draft.decorations}>
          <div className="absolute inset-0 px-6 py-8">
            <TextRangeSelector text={draft.quotedText} onSelect={setRange} />
          </div>
        </TraceNote>
      </div>

      <div className="flex flex-col gap-3 px-4 pt-8">
        <span className="text-body-14md text-text-inverse">효과</span>
        <EffectPicker onPick={handlePick} disabled={false} />
      </div>

      <div className="mt-auto flex gap-2 px-4 pb-4">
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            router.back()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="flex-1"
          disabled={draft.decorations.length === 0}
          onClick={() => {
            router.push('/trace/new/opinion')
          }}
        >
          다음
        </Button>
      </div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </div>
  )
}
```

`TraceNote` 위에 `TextRangeSelector`를 겹쳐 올린다. 두 텍스트가 같은 폰트·행간·패딩을 쓰므로 글자 위치가 정렬된다. 어긋나면 `TraceNote`의 `<p>` 클래스를 `TextRangeSelector`와 동일하게 맞춘다.

- [ ] **Step 3: page.tsx 연결 후 검증·커밋**

```tsx
import { TraceDecorateForm } from '../_components/TraceDecorateForm/TraceDecorateForm'

export default function TraceDecoratePage() {
  return <TraceDecorateForm />
}
```

Run: `pnpm lint && pnpm typecheck && pnpm test`

```bash
git add app/trace/new
git commit -m "feat: 대목 꾸미기 화면과 효과 선택기 추가"
```

---

## Task 15: 병합 다이얼로그

`/trace/new/decorate`의 `다음`에서 `similar-check`를 호출하고 후보가 있으면 다이얼로그를 띄운다. **실패는 플로우를 막지 않는다** — 조용히 건너뛴다.

**Files:**

- Create: `app/trace/new/_components/MergeDialog/MergeDialog.tsx`
- Modify: `app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx`

**Interfaces:**

- Consumes: Task 5 `Dialog`, Task 9 `passageMutations.similarCheck()`
- Produces: `MergeDialog({ open, myQuote, candidateQuote, onMerge, onSeparate })`

- [ ] **Step 1: MergeDialog 구현**

`app/trace/new/_components/MergeDialog/MergeDialog.tsx`

```tsx
'use client'

import { Dialog } from '@/app/_global/_components/Dialog/Dialog'

type MergeDialogProps = {
  open: boolean
  myQuote: string
  candidateQuote: string
  onMerge: () => void
  onSeparate: () => void
}

export function MergeDialog({
  open,
  myQuote,
  candidateQuote,
  onMerge,
  onSeparate,
}: MergeDialogProps) {
  return (
    <Dialog open={open} title={'기존 문장과 유사해요.\n의견을 하나로 모을까요?'}>
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <h3 className="text-body-14md text-text-secondary">내가 발췌한 문장</h3>
          <p className="rounded-lg bg-bg-surface p-4 text-body-14rg text-text-secondary">
            {myQuote}
          </p>
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="text-body-14md text-text-secondary">비슷한 문장</h3>
          <p className="rounded-lg bg-bg-surface p-4 text-body-14rg text-text-secondary">
            {candidateQuote}
          </p>
        </section>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onMerge}
          className="rounded-2xl bg-interactive-accent py-4 text-body-16bd text-text-inverse"
        >
          합칠게요
        </button>
        <button
          type="button"
          onClick={onSeparate}
          className="rounded-2xl bg-interactive-btn-primary py-4 text-body-16bd text-text-inverse"
        >
          따로 남길게요
        </button>
      </div>
    </Dialog>
  )
}
```

`Dialog`의 `<h2>`에는 Task 5에서 이미 `whitespace-pre-line`이 들어 있으므로 `\n`이 든 제목이 두 줄로 렌더된다. 추가 작업이 없다.

- [ ] **Step 2: TraceDecorateForm에 병합 흐름 연결**

`다음` 버튼의 `onClick`을 바꾸고 상태와 mutation을 추가한다.

```tsx
const similarCheck = useMutation(passageMutations.similarCheck())
const [candidate, setCandidate] = useState<{ passageId: number; quotedText: string } | null>(null)

const goToOpinion = () => {
  router.push('/trace/new/opinion')
}

const handleNext = () => {
  if (!draft.book || draft.pageNumber === null) return
  similarCheck.mutate(
    {
      bookId: draft.book.bookId,
      pageNumber: draft.pageNumber,
      quotedText: draft.quotedText,
    },
    {
      onSuccess: (response) => {
        const first = response.data.passages?.[0]
        if (first) {
          setCandidate({ passageId: first.passageId, quotedText: first.quotedText })
          return
        }
        goToOpinion()
      },
      // 유사 검사는 편의 기능이다. 실패해도 흔적 작성을 막지 않는다.
      onError: goToOpinion,
    },
  )
}
```

렌더 끝에 다이얼로그를 추가한다.

```tsx
<MergeDialog
  open={candidate !== null}
  myQuote={draft.quotedText}
  candidateQuote={candidate?.quotedText ?? ''}
  onMerge={() => {
    dispatch({ type: 'setMergeTarget', passageId: candidate?.passageId ?? null })
    goToOpinion()
  }}
  onSeparate={() => {
    dispatch({ type: 'setMergeTarget', passageId: null })
    goToOpinion()
  }}
/>
```

`다음` 버튼은 `onClick={handleNext}`, `disabled={draft.decorations.length === 0 || similarCheck.isPending}`으로 바꾼다.

`response.data.passages`의 실제 접근 경로는 `DataResponseSimilarCandidates` 생성 타입을 열어 확인한다.

- [ ] **Step 3: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/trace/new app/_global/_components/Dialog
git commit -m "feat: 유사 대목 병합 확인 다이얼로그 추가"
```

---

## Task 16: 3/3 의견 작성과 저장

플로우의 종점. `POST /api/opinions`가 여기서 한 번 나간다. **실패해도 draft를 버리지 않는다.**

**Files:**

- Modify: `app/trace/new/opinion/page.tsx`
- Create: `app/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx`

**Interfaces:**

- Consumes: Task 3 `ApiError`(`_data/api.model`), Task 9 `opinionMutations.create()`, Task 11 `TraceNote`, Task 5 `Snackbar`
- Produces: `TraceOpinionForm()`

- [ ] **Step 1: 구현**

`app/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx`

```tsx
'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { Textarea } from '@/app/_global/_components/Textarea/Textarea'
import { ApiError } from '@/app/_global/_data/api.model'
import { opinionMutations } from '@/app/_global/_queries/opinion.queries'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { TraceNote } from '../TraceNote/TraceNote'
import { TraceStepHeader } from '../TraceStepHeader/TraceStepHeader'

export function TraceOpinionForm() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()
  const [message, setMessage] = useState('')
  const createOpinion = useMutation(opinionMutations.create())

  const handleSubmit = () => {
    if (!draft.book) return
    createOpinion.mutate(
      {
        bookId: draft.book.bookId,
        pageNumber: draft.pageNumber ?? undefined,
        quotedText: draft.quotedText,
        isSpoiler: draft.isSpoiler,
        passageId: draft.passageId,
        content: draft.content,
        decorations: draft.decorations.map((decoration) => ({
          startOffset: decoration.startOffset,
          endOffset: decoration.endOffset,
          effectType: decoration.effectType,
          color: decoration.color,
        })),
      },
      {
        onSuccess: (response) => {
          dispatch({
            type: 'setResult',
            result: { opinionId: response.data.opinionId, merged: response.data.merged },
          })
          router.replace('/trace/new/done')
        },
        onError: (error) => {
          // draft는 그대로 둔다. 여기서 날리면 사용자가 입력한 전부가 사라진다.
          if (
            error instanceof ApiError &&
            (error.code === 'PASSAGE_400_2' || error.code === 'PASSAGE_404_1')
          ) {
            dispatch({ type: 'setMergeTarget', passageId: null })
            setMessage('합치려던 대목이 사라졌어요. 다시 시도해주세요.')
            return
          }
          setMessage('흔적을 남기지 못했어요. 잠시 후 다시 시도해주세요.')
        },
      },
    )
  }

  return (
    <div className="relative flex flex-1 flex-col bg-bg-dark">
      <div className="bg-bg-alternative pb-6">
        <TraceStepHeader
          step={3}
          title={'해당 대목에 남기고 싶은 흔적을\n자유롭게 작성해 주세요.'}
        />
      </div>
      <div className="-mt-4 px-8">
        <TraceNote quotedText={draft.quotedText} decorations={draft.decorations} />
      </div>

      <div className="px-4 pt-6">
        <Textarea
          variant="dark"
          maxLength={300}
          value={draft.content}
          placeholder="의견을 작성해주세요."
          onChange={(event) => {
            dispatch({ type: 'setContent', content: event.target.value })
          }}
        />
      </div>

      <div className="mt-auto flex gap-2 px-4 pb-4">
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            router.back()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="flex-1"
          disabled={draft.content.trim().length === 0 || createOpinion.isPending}
          onClick={handleSubmit}
        >
          흔적 남기기
        </Button>
      </div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </div>
  )
}
```

`ApiError`는 Task 3에서 이미 `app/_global/_data/api.model.ts`로 옮겨져 있다. `_apis`가 아니라 `_data`에서 import해야 `no-restricted-imports`에 걸리지 않는다.

- [ ] **Step 2: page.tsx 연결**

```tsx
import { TraceOpinionForm } from '../_components/TraceOpinionForm/TraceOpinionForm'

export default function TraceOpinionPage() {
  return <TraceOpinionForm />
}
```

- [ ] **Step 3: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/trace/new
git commit -m "feat: 의견 작성 화면과 흔적 저장 추가"
```

---

## Task 17: 완료 화면

**Files:**

- Modify: `app/trace/new/done/page.tsx`
- Create: `app/trace/new/_components/TraceDoneView/TraceDoneView.tsx`

**Interfaces:**

- Consumes: Task 7 `useTraceDraft`
- Produces: `TraceDoneView()` — `뒤로`는 홈(`/`)으로, `흔적 남기기`는 `resetKeepingBook` 후 `/trace/new`로 보낸다. Task 10의 `BookPicker`가 책이 남아 있고 대목이 비었으면 방식 선택 시트를 자동으로 연다.

- [ ] **Step 1: 구현**

`app/trace/new/_components/TraceDoneView/TraceDoneView.tsx`

```tsx
'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@/app/_global/_components/Button/Button'

import { useTraceDraft } from '../../_hooks/useTraceDraft'

export function TraceDoneView() {
  const router = useRouter()
  const { draft, dispatch } = useTraceDraft()

  return (
    <div className="flex flex-1 flex-col bg-bg-overlay">
      <div className="flex flex-1 items-end justify-center pb-6">
        {draft.book?.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
          <img
            src={draft.book.coverImageUrl}
            alt={draft.book.title}
            className="h-52 w-36 rounded-[2px] object-cover"
          />
        ) : (
          <span className="h-52 w-36 rounded-[2px] bg-bg-gray" />
        )}
      </div>

      <div className="flex flex-col items-center gap-2 rounded-t-[28px] bg-bg-default px-4 pt-8 pb-4">
        <h1 className="text-title-20sb text-text-primary">흔적을 책에 끼워두었어요!</h1>
        <p className="text-center text-body-14md text-text-tertiary">
          또 남기고 싶은 문장이 있다면
          <br />
          아래 버튼을 눌러 더 남겨보세요.
        </p>
        <div className="mt-6 flex w-full gap-2">
          <Button
            variant="back"
            className="flex-1"
            onClick={() => {
              dispatch({ type: 'reset' })
              router.push('/')
            }}
          >
            뒤로
          </Button>
          <Button
            variant="activated"
            className="flex-1"
            onClick={() => {
              dispatch({ type: 'resetKeepingBook' })
              router.push('/trace/new')
            }}
          >
            흔적 남기기
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: page.tsx 연결 후 검증·커밋**

```tsx
import { TraceDoneView } from '../_components/TraceDoneView/TraceDoneView'

export default function TraceDonePage() {
  return <TraceDoneView />
}
```

Run: `pnpm lint && pnpm typecheck && pnpm test`

```bash
git add app/trace/new
git commit -m "feat: 흔적 작성 완료 화면 추가"
```

---

## Task 18: 카메라 blob 확장과 OCR 텍스트 조립

OCR은 `multipart/form-data`로 파일 바이트를 요구하는데 기존 `useCamera`는 `webPath` 문자열만 돌려준다.

**Files:**

- Modify: `app/_global/_hooks/useCamera.ts`
- Create: `app/trace/new/_services/ocrText.service.ts`
- Test: `app/trace/new/_tests/ocrText.spec.ts`
- Modify: `app/_global/_tests/useCamera.spec.ts` (기존 테스트가 깨지면 함께 고친다)

**Interfaces:**

- Consumes: 없음
- Produces:
  - `useCamera()` → `{ takePhoto: () => Promise<{ webPath: string; blob: Blob } | null> }`
  - `joinBlockTexts(blocks: OcrBlock[]): string` — `OcrBlock = { text: string; lineBreak: boolean }`. `lineBreak`가 true인 블록 뒤에는 `\n`, 아니면 공백을 넣는다. 마지막 블록 뒤에는 아무것도 붙이지 않는다.
  - `clampQuote(text: string, max: number): string` — 초과분을 잘라낸다.

- [ ] **Step 1: OCR 텍스트 조립 테스트 작성**

`app/trace/new/_tests/ocrText.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import { clampQuote, joinBlockTexts } from '../_services/ocrText.service'

describe('joinBlockTexts', () => {
  it('빈 배열은 빈 문자열이다', () => {
    expect(joinBlockTexts([])).toBe('')
  })

  it('lineBreak가 false면 공백으로 잇는다', () => {
    expect(
      joinBlockTexts([
        { text: '우리는', lineBreak: false },
        { text: '모두', lineBreak: false },
      ]),
    ).toBe('우리는 모두')
  })

  it('lineBreak가 true면 줄바꿈으로 잇는다', () => {
    expect(
      joinBlockTexts([
        { text: '우리는 모두', lineBreak: true },
        { text: '이야기를 찾아 헤맨다.', lineBreak: false },
      ]),
    ).toBe('우리는 모두\n이야기를 찾아 헤맨다.')
  })

  it('마지막 블록 뒤에는 구분자를 붙이지 않는다', () => {
    expect(joinBlockTexts([{ text: '끝', lineBreak: true }])).toBe('끝')
  })
})

describe('clampQuote', () => {
  it('한도 이하면 그대로 둔다', () => {
    expect(clampQuote('12345', 10)).toBe('12345')
  })

  it('한도를 넘으면 잘라낸다', () => {
    expect(clampQuote('1234567890', 5)).toBe('12345')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test -- ocrText`
Expected: FAIL — 모듈을 찾을 수 없다.

- [ ] **Step 3: 구현**

`app/trace/new/_services/ocrText.service.ts`

```ts
export type OcrBlock = { text: string; lineBreak: boolean }

export function joinBlockTexts(blocks: OcrBlock[]): string {
  return blocks.reduce((acc, block, index) => {
    if (index === blocks.length - 1) return acc + block.text
    return acc + block.text + (block.lineBreak ? '\n' : ' ')
  }, '')
}

export function clampQuote(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max)
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test -- ocrText`
Expected: PASS (6 tests)

- [ ] **Step 5: useCamera에 blob 변환 추가**

`app/_global/_hooks/useCamera.ts`의 `Photo` 타입과 두 경로를 함께 고친다.

```ts
export type Photo = { webPath: string; blob: Blob }

async function toPhoto(webPath: string): Promise<Photo> {
  const res = await fetch(webPath)
  return { webPath, blob: await res.blob() }
}
```

네이티브 경로는 `photo.webPath ? await toPhoto(photo.webPath) : null`로, 파일 입력 경로는 `file`이 이미 `Blob`이므로 `{ webPath: URL.createObjectURL(file), blob: file }`로 바꾼다.

`app/_global/_tests/useCamera.spec.ts`를 열어 `Photo` 형태를 검사하는 단언이 있으면 `blob`을 포함하도록 고친다.

- [ ] **Step 6: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/_global/_hooks/useCamera.ts app/_global/_tests app/trace/new
git commit -m "feat: 카메라 결과에 blob을 포함하고 OCR 텍스트 조립 서비스 추가"
```

---

## Task 19: 사진 → OCR 선택 화면

플로우의 마지막 조각. `/trace/new/photo`에서 촬영 → OCR → 블록 드래그 선택 → `/trace/new/detail`로 합류한다.

`TextBlock.boundingBox`가 블록 단위로만 오고 글자 단위 좌표가 없으므로 **선택은 블록 단위**다.

**Files:**

- Modify: `app/trace/new/photo/page.tsx`
- Create: `app/trace/new/_components/OcrSelector/OcrSelector.tsx`

**Interfaces:**

- Consumes: Task 9 `passageMutations.ocr()`, Task 18 `useCamera`·`joinBlockTexts`·`clampQuote`, Task 5 `Snackbar`
- Produces: `OcrSelector()`

- [ ] **Step 1: 구현**

`app/trace/new/_components/OcrSelector/OcrSelector.tsx`

```tsx
'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { useCamera } from '@/app/_global/_hooks/useCamera'
import { passageMutations } from '@/app/_global/_queries/passage.queries'

import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { clampQuote, joinBlockTexts, type OcrBlock } from '../../_services/ocrText.service'

type PositionedBlock = OcrBlock & { left: number; top: number; width: number; height: number }

const MAX_QUOTE_LENGTH = 150

export function OcrSelector() {
  const router = useRouter()
  const { dispatch } = useTraceDraft()
  const { takePhoto } = useCamera()
  const ocr = useMutation(passageMutations.ocr())
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<PositionedBlock[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [message, setMessage] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    void (async () => {
      const photo = await takePhoto()
      if (!photo) {
        router.back()
        return
      }
      setImageUrl(photo.webPath)
      try {
        const response = await ocr.mutateAsync({ image: photo.blob })
        setBlocks(
          (response.data.blocks ?? []).map((block) => {
            const xs = (block.boundingBox.vertices ?? []).map((point) => point.x)
            const ys = (block.boundingBox.vertices ?? []).map((point) => point.y)
            const left = Math.min(...xs)
            const top = Math.min(...ys)
            return {
              text: block.text,
              lineBreak: block.lineBreak,
              left,
              top,
              width: Math.max(...xs) - left,
              height: Math.max(...ys) - top,
            }
          }),
        )
      } catch {
        setMessage('글자를 읽지 못했어요. 다시 찍어주세요.')
      }
    })()
  }, [takePhoto, ocr, router])

  const quotedText = clampQuote(
    joinBlockTexts(blocks.filter((_, index) => selected.has(index))),
    MAX_QUOTE_LENGTH,
  )

  return (
    <div className="relative flex flex-1 flex-col bg-bg-black">
      <div className="relative flex-1 overflow-auto">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- blob URL은 next/image가 다루지 않는다
          <img src={imageUrl} alt="촬영한 책 페이지" className="w-full" />
        )}
        {blocks.map((block, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={selected.has(index)}
            onClick={() => {
              setSelected((prev) => {
                const next = new Set(prev)
                if (next.has(index)) next.delete(index)
                else next.add(index)
                return next
              })
            }}
            style={{
              left: `${String(block.left)}px`,
              top: `${String(block.top)}px`,
              width: `${String(block.width)}px`,
              height: `${String(block.height)}px`,
            }}
            className={
              selected.has(index)
                ? 'absolute rounded-[2px] bg-orange-400/40'
                : 'absolute rounded-[2px] bg-white-a20'
            }
          />
        ))}
      </div>

      <div className="flex gap-2 px-4 py-4">
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            router.back()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="flex-1"
          disabled={quotedText.length === 0}
          onClick={() => {
            dispatch({ type: 'setQuotedText', quotedText })
            router.push('/trace/new/detail')
          }}
        >
          다음
        </Button>
      </div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </div>
  )
}
```

좌표는 원본 이미지 픽셀 기준이고 `<img>`는 컨테이너 폭에 맞춰 축소되므로 **오버레이가 어긋난다.** 이미지의 `naturalWidth`와 실제 렌더 폭의 비율을 구해 좌표에 곱해야 한다. `onLoad`에서 `event.currentTarget.naturalWidth`와 `clientWidth`로 배율을 계산해 state에 담고, 각 `style` 값에 곱한다.

- [ ] **Step 2: 배율 보정 적용**

`const [scale, setScale] = useState(1)`을 추가하고 `<img>`에 다음을 붙인다.

```tsx
onLoad={(event) => {
  const image = event.currentTarget
  setScale(image.clientWidth / image.naturalWidth)
}}
```

블록 `style`의 네 값에 각각 `* scale`을 곱한다.

- [ ] **Step 3: page.tsx 연결**

```tsx
import { OcrSelector } from '../_components/OcrSelector/OcrSelector'

export default function TracePhotoPage() {
  return <OcrSelector />
}
```

- [ ] **Step 4: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/trace/new
git commit -m "feat: 사진 OCR 블록 선택 화면 추가"
```

- [ ] **Step 5: 실기기 확인**

Run: `pnpm build && pnpm start`

`next dev`는 WKWebView에서 하이드레이션이 되지 않는다(`docs/capacitor.md`). 웹뷰 확인은 반드시 프로덕션 빌드로 한다. 카메라·갤러리 프롬프트가 뜨는지, OCR 오버레이가 사진 위에 정렬되는지, `TextBlock`이 단어·줄·문단 중 어느 단위로 오는지 확인하고 결과를 보고한다. **문단 단위로 오면 블록 선택 UI를 다시 잡아야 한다(스펙 리스크 1).**

---

## 마지막 확인

- [ ] **전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: 전부 PASS

- [ ] **수동 완주**

`.env.local`에 `NEXT_PUBLIC_API_URL`과 dev 토큰을 채운 뒤 `/`에서 '흔적 남기기' → 책 선택 → 직접 입력 → 페이지·스포일러 → 효과 → (병합) → 의견 → 완료까지 진행한다. 실제로 저장됐는지 `GET /api/users/me/opinions`로 확인한다.

dev DB가 비어 있어 책 목록이 나오지 않으면 백엔드에 시드를 요청한다(스펙 리스크 3).

- [ ] **이슈 완료 기준 대조**

[#34](https://github.com/Nexters/pallang-client/issues/34)의 체크박스 여섯 개를 하나씩 확인한다.

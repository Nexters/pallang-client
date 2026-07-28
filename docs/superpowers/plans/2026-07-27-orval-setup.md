# orval 세팅 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OpenAPI 스펙(`https://api-dev.pallang.co.kr/v3/api-docs`)에서 orval로 타입 + 태그별 fetch 함수를 생성해 `_apis` 레이어로 사용하고, `_queries`는 수동 유지한다.

**Architecture:** orval `client: 'fetch'` + `mode: 'tags-split'`로 `app/_global/_apis/_generated/`에 생성. 수동 작성 mutator(`customFetch.api.ts`)가 baseURL·Bearer 토큰·에러 변환을 담당. 생성 디렉토리는 lint 제외, feature의 `_generated` 직접 import는 기존 no-restricted-imports 글롭 확장으로 차단.

**Tech Stack:** orval (devDependency), TanStack Query v5, Next.js 16, Vitest.

## Global Constraints

- default export 금지 (Next 특수 파일·`**/*.config.{js,mjs,ts}`·`.d.ts`만 예외 — eslint 예외 목록에 파일을 추가하면 허용 가능)
- 배럴 파일(index.ts) 금지
- `_apis` 파일명은 CAMEL_CASE (`ignoreMiddleExtensions`로 `.api`/`.spec` 접미사 허용)
- 객체 타입은 `type` 별칭
- `console.log` 금지
- 코드 변경 후 `pnpm lint && pnpm typecheck && pnpm test` 통과 필수
- 커밋 메시지는 Conventional Commits (`feat:`, `chore:` …)

---

### Task 1: Custom mutator `customFetch.api.ts` (TDD)

**Files:**

- Create: `app/_global/_apis/customFetch.api.ts`
- Test: `app/_global/_tests/customFetch.spec.ts`

**Interfaces:**

- Produces: `customFetch<T>(url: string, options: RequestInit): Promise<T>` — orval mutator 시그니처. `ApiError { status: number; code: string; message }` class. `setAccessTokenGetter(getter: () => string | null): void`.

- [ ] **Step 1: 실패하는 테스트 작성** — `app/_global/_tests/customFetch.spec.ts`

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, customFetch, setAccessTokenGetter } from '@/app/_global/_apis/customFetch.api'

function mockFetch(response: Response) {
  const spy = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('customFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    setAccessTokenGetter(() => null)
  })

  it('200 응답이면 JSON body를 반환한다', async () => {
    mockFetch(new Response(JSON.stringify({ id: 1 }), { status: 200 }))
    await expect(customFetch<{ id: number }>('/api/books', { method: 'GET' })).resolves.toEqual({
      id: 1,
    })
  })

  it('토큰 getter가 설정되면 Authorization 헤더를 붙인다', async () => {
    const spy = mockFetch(new Response('{}', { status: 200 }))
    setAccessTokenGetter(() => 'token-123')
    await customFetch('/api/books', { method: 'GET' })
    const headers = new Headers((spy.mock.calls[0]?.[1] as RequestInit).headers)
    expect(headers.get('Authorization')).toBe('Bearer token-123')
  })

  it('에러 응답이면 ErrorResponse를 담은 ApiError를 던진다', async () => {
    mockFetch(
      new Response(
        JSON.stringify({
          type: '/api/books',
          title: 'BOOK_404_1',
          status: 404,
          detail: '해당 도서를 찾을 수 없습니다.',
        }),
        { status: 404 },
      ),
    )
    const error = await customFetch('/api/books/1', { method: 'GET' }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 404,
      code: 'BOOK_404_1',
      message: '해당 도서를 찾을 수 없습니다.',
    })
  })

  it('에러 body가 JSON이 아니면 HTTP 상태 기반 fallback을 쓴다', async () => {
    mockFetch(new Response('oops', { status: 500, statusText: 'Internal Server Error' }))
    const error = await customFetch('/api/books', { method: 'GET' }).catch((e: unknown) => e)
    expect(error).toMatchObject({ status: 500, code: 'HTTP_500' })
  })
})
```

- [ ] **Step 2: 테스트 실패 확인** — Run: `pnpm test -- app/_global/_tests/customFetch.spec.ts` / Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현** — `app/_global/_apis/customFetch.api.ts`

```ts
// orval mutator — 생성된 fetch 함수가 이 함수를 경유한다.
type ErrorBody = {
  type?: string
  title?: string
  status?: number
  detail?: string
}

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

type AccessTokenGetter = () => string | null

let getAccessToken: AccessTokenGetter = () => null

export function setAccessTokenGetter(getter: AccessTokenGetter) {
  getAccessToken = getter
}

export async function customFetch<T>(url: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
  const res = await fetch(`${baseUrl}${url}`, { ...options, headers })

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorBody | null
    throw new ApiError(
      res.status,
      body?.title ?? `HTTP_${res.status}`,
      body?.detail ?? res.statusText,
    )
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
```

(strictTypeChecked lint가 `undefined as T` 등에 걸리면 해당 라인만 최소한으로 조정한다.)

- [ ] **Step 4: 테스트 통과 확인** — Run: `pnpm test -- app/_global/_tests/customFetch.spec.ts` / Expected: PASS
- [ ] **Step 5: 검증 & 커밋** — Run: `pnpm lint && pnpm typecheck && pnpm test`

```bash
git add app/_global/_apis/customFetch.api.ts app/_global/_tests/customFetch.spec.ts
git commit -m "feat: orval mutator용 customFetch 추가"
```

---

### Task 2: orval 설치 + 설정 + transformer + env

**Files:**

- Create: `orval.config.ts`, `orval.transformer.ts`, `.env.local`, `.env.example`
- Modify: `package.json` (scripts), `eslint.config.mjs` (default export 예외에 `orval.transformer.ts` 추가)

**Interfaces:**

- Consumes: Task 1의 `customFetch` (mutator로 지정)
- Produces: `pnpm api:gen` 스크립트, `NEXT_PUBLIC_API_URL` env 키

- [ ] **Step 1: orval 설치** — Run: `pnpm add -D orval`
- [ ] **Step 2: transformer 작성** — `orval.transformer.ts` (태그 `대목(Passage)` → `Passage` 리네임)

```ts
import { defineTransformer } from 'orval'

const TAG_RENAMES: Record<string, string> = {
  '대목(Passage)': 'Passage',
}

const renameTag = (tag: string) => TAG_RENAMES[tag] ?? tag

export default defineTransformer((spec) => ({
  ...spec,
  tags: spec.tags?.map((tag) => ({ ...tag, name: renameTag(tag.name) })),
  paths: Object.fromEntries(
    Object.entries(spec.paths ?? {}).map(([path, methods]) => [
      path,
      Object.fromEntries(
        Object.entries(methods ?? {}).map(([method, operation]) => [
          method,
          typeof operation === 'object' && operation !== null && 'tags' in operation
            ? { ...operation, tags: (operation.tags as string[] | undefined)?.map(renameTag) }
            : operation,
        ]),
      ),
    ]),
  ),
}))
```

(defineTransformer의 실제 스펙 타입에 맞춰 타입 에러가 나면 최소한으로 조정한다.)

- [ ] **Step 3: orval.config.ts 작성**

```ts
import { defineConfig } from 'orval'

export default defineConfig({
  pallang: {
    input: {
      target: 'https://api-dev.pallang.co.kr/v3/api-docs',
      override: {
        transformer: './orval.transformer.ts',
      },
    },
    output: {
      mode: 'tags-split',
      client: 'fetch',
      target: 'app/_global/_apis/_generated',
      schemas: 'app/_global/_apis/_generated/models',
      formatter: 'prettier',
      override: {
        mutator: {
          path: 'app/_global/_apis/customFetch.api.ts',
          name: 'customFetch',
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
})
```

- [ ] **Step 4: package.json에 스크립트 추가** — `"api:gen": "orval"`
- [ ] **Step 5: env 파일** — `.env.local`과 `.env.example` 각각에 `NEXT_PUBLIC_API_URL=https://api-dev.pallang.co.kr` (`.env.local`이 gitignore에 있는지 확인, 없으면 추가)
- [ ] **Step 6: eslint 예외** — `eslint.config.mjs`의 default export 허용 files 배열에 `'orval.transformer.ts'` 추가
- [ ] **Step 7: 검증 & 커밋** — Run: `pnpm lint && pnpm typecheck && pnpm test`

```bash
git add orval.config.ts orval.transformer.ts .env.example package.json pnpm-lock.yaml eslint.config.mjs .gitignore
git commit -m "chore: orval 설정 및 스펙 transformer 추가"
```

---

### Task 3: 코드 생성 + lint 제외 + import 경계

**Files:**

- Create: `app/_global/_apis/_generated/**` (생성물)
- Modify: `eslint.config.mjs` (globalIgnores + no-restricted-imports 글롭 확장), `.prettierignore`

**Interfaces:**

- Consumes: Task 2의 `pnpm api:gen`
- Produces: 태그별 fetch 함수 (예: `_generated/book/book.ts`의 `getHomeCarouselBooks`), `_generated/models/*` 타입

- [ ] **Step 1: eslint 제외** — `eslint.config.mjs` `globalIgnores` 배열에 `'app/_global/_apis/_generated/**'` 추가
- [ ] **Step 2: no-restricted-imports 글롭 확장** — 기존 `patterns`의 `group`을 `['**/_apis/**', '@/app/_global/_apis/**']`로 변경 (기존 `_apis/*`는 1뎁스만 잡아서 `_generated/book/book` 같은 딥 경로를 놓침)
- [ ] **Step 3: .prettierignore에 추가** — `app/_global/_apis/_generated`
- [ ] **Step 4: 생성 실행** — Run: `pnpm api:gen` / Expected: 8개 태그 디렉토리(auth, book, comment, notice, opinion, user, user-book-status, passage) + models 생성. 한글 파일명이 없는지 확인: `find app/_global/_apis/_generated -name '*대목*'` 결과 없음.
- [ ] **Step 5: 검증** — Run: `pnpm lint && pnpm typecheck && pnpm test` / Expected: PASS (생성물 타입 에러 시 orval 옵션으로 해결하고 수동 수정 금지)
- [ ] **Step 6: 커밋**

```bash
git add app/_global/_apis/_generated eslint.config.mjs .prettierignore
git commit -m "feat: orval로 API 클라이언트 생성"
```

---

### Task 4: end-to-end 샘플 `book.queries.ts`

**Files:**

- Create: `app/_global/_queries/book.queries.ts`

**Interfaces:**

- Consumes: `_generated/book/book.ts`의 `getHomeCarouselBooks` (실제 export 이름은 생성 파일에서 확인 — orval이 camelCase로 유지함)

- [ ] **Step 1: 생성물 확인** — `app/_global/_apis/_generated/book/book.ts`를 읽고 `getHomeCarouselBooks`의 정확한 시그니처(파라미터 유무, 반환 타입) 확인
- [ ] **Step 2: book.queries.ts 작성**

```ts
import { queryOptions } from '@tanstack/react-query'

import { getHomeCarouselBooks } from '@/app/_global/_apis/_generated/book/book'

export const bookQueries = {
  all: () => ['book'] as const,
  homeCarousel: () =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'home-carousel'],
      queryFn: () => getHomeCarouselBooks(),
    }),
}
```

(시그니처가 파라미터를 요구하면 Step 1에서 확인한 대로 맞춘다. import 경로도 실제 생성 파일 경로에 맞춘다.)

- [ ] **Step 3: 검증** — Run: `pnpm lint && pnpm typecheck && pnpm test` / Expected: PASS
- [ ] **Step 4: 커밋**

```bash
git add app/_global/_queries/book.queries.ts
git commit -m "feat: book 도메인 queryOptions 추가"
```

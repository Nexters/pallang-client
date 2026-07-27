# orval 세팅 설계

날짜: 2026-07-27
스펙 소스: https://api-dev.pallang.co.kr/v3/api-docs (OpenAPI 3.1, 30 paths, 8 tags, 77 schemas)

## 목표

원격 OpenAPI 스펙에서 DTO 타입과 태그별 fetch 함수를 orval로 생성해 `_apis` 레이어를 대체한다.
`_queries`(queryOptions 팩토리)는 기존 컨벤션대로 수동 작성을 유지한다.

## 결정 사항

- **생성 범위**: 타입 + fetch 함수까지. TanStack Query 훅/queryOptions는 생성하지 않는다
  (기존 queryKey 팩토리 컨벤션과 이중 체계가 되는 것을 방지).
- **스펙 동기화**: 원격 URL 직접 참조. 스냅샷 커밋 없음. 생성물을 커밋하므로
  API 변경 리뷰는 생성물 diff로 한다.

## 구성

### 1. 의존성 & 스크립트

- `orval` devDependency 추가 (런타임 의존성 없음).
- `package.json`에 `"api:gen": "orval"` 스크립트 추가. 실행 시 원격 스펙을 fetch해 생성.

### 2. orval.config.ts (repo 루트)

- `input.target`: `https://api-dev.pallang.co.kr/v3/api-docs`
- `input.override.transformer`: 태그 `대목(Passage)` → `Passage` 리네임
  (한글+괄호 파일명 방지).
- `output.client`: `fetch`
- `output.mode`: `tags-split` → 태그별 1파일 (Auth, Book, Comment, Notice, Opinion,
  User, UserBookStatus, Passage).
- `output.target`: `app/_global/_apis/_generated/`, 모델은 `_generated/models/`.
- orval의 prettier 후처리 옵션 활성화.
- 생성 디렉토리는 ESLint/Prettier 검사에서 제외 (파일 네이밍·import 정렬 lint 충돌 방지).

### 3. Custom mutator — `app/_global/_apis/customFetch.api.ts` (수동 작성)

- baseURL: `NEXT_PUBLIC_API_URL` env. `.env.local`에 `https://api-dev.pallang.co.kr` 설정,
  `.env.example`(없으면 생성)에 키 문서화.
- Bearer 토큰: 모듈 레벨 token getter(`setAccessTokenGetter`)를 열어둔다.
  auth 코드가 아직 없으므로 getter 미설정 시 Authorization 헤더를 생략한다.
- 에러 처리: `!res.ok`이면 스펙의 `ErrorResponse` 형태(`title`=에러코드, `detail`=메시지)를
  담은 커스텀 에러(`ApiError`)를 throw → 사용부에서 에러코드로 분기 가능.

### 4. 사용 방식 (기존 컨벤션 유지)

```ts
// _queries/book.queries.ts (수동)
import { getBook } from '@/app/_global/_apis/_generated/book/book'

export const bookQueries = {
  all: () => ['book'] as const,
  detail: (id: number) =>
    queryOptions({ queryKey: [...bookQueries.all(), id], queryFn: () => getBook(id) }),
}
```

- feature → `_queries` 경유 규칙 유지.
- `_generated` 직접 import는 `_queries`/`_apis`에서만 허용 (eslint-plugin-boundaries에 규칙 추가).

## 검증

- `pnpm api:gen` 실행 후 `pnpm lint && pnpm typecheck && pnpm test` 통과.
- 생성된 fetch 함수 1개를 사용하는 `_queries` 파일 1개를 실제로 작성해 end-to-end 확인.

## 스킵한 것 (필요해지면 추가)

- zod 런타임 검증 — zod 미설치. 서버 응답 신뢰 문제가 생기면 추가.
- 스펙 스냅샷 커밋 — 재현성/오프라인 생성이 필요해지면 추가.
- CI 생성물 드리프트 검사 — 생성물이 스펙과 어긋나는 사고가 반복되면 추가.

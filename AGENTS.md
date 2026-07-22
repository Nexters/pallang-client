<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 명령어

- `pnpm dev` — 개발 서버 (MCP 엔드포인트 `/_next/mcp` 포함)
- `pnpm build` — 프로덕션 빌드 (cacheComponents/PPR 활성)
- `pnpm lint` / `pnpm lint:fix` — ESLint (타입 인지 strict + 컨벤션)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm test` / `pnpm test:watch` — Vitest
- `pnpm format` — Prettier

**변경 후 반드시 `pnpm lint && pnpm typecheck && pnpm test` 로 검증할 것.**

## 디렉토리 규칙 (스파르타 App Router)

- `app/_global/` — 앱 전역. `_providers/ _components/ _hooks/ _queries/ _apis/ _data/ _styles/`. **서버 쿼리(`.queries.ts`)·API(`.api.ts`)는 무조건 여기.**
- `app/_shared/<domain>/` — 2개 이상 지면 공용. `_components/ _hooks/ _data/`.
- `app/<kebab-route>/` — 지면 전용. `_components/ _hooks/ _services/ _data/ _actions/ _types/ _tests/`.
- 배치 판단: 2곳 이상 사용 → `_shared`, 앱 루트 필요 → `_global`, 모호하면 `_shared`부터 (co-location).

## 네이밍 & 접미사

- 컴포넌트 폴더/파일: `PascalCase` (`ExampleCard/ExampleCard.tsx`)
- 훅·서비스·스토어·쿼리·API: `camelCase`
- URL 경로: `kebab-case`
- 접미사: `.service.ts` / `.store.ts`·`.model.ts`·`.constant.ts` / `.queries.ts` / `.api.ts` / `.action.ts` / `.type.ts` / `.spec.ts`
- 객체 타입은 `type` 별칭 사용 (lint로 강제).

## 금지 & 강제 (lint로 차단됨)

- **default export 금지** — Next 특수 파일(page/layout 등)·설정 파일만 예외. 컴포넌트는 named export 1개.
- **배럴 파일(index.ts/tsx) 금지** — 생성·import 모두.
- **import 경로** — 같은 라우트 내부는 상대경로, `_shared`/`_global`은 `@/` 절대경로.
- **피처 코드에서 `_apis` 직접 import 금지** — `@/app/_global/_queries`의 queryOptions 사용.
- **아키텍처 경계(레이어)** — `feature`끼리 서로 import 금지, `_global`/`_shared`는 `feature`를 역참조 금지. 허용: feature→(global·shared·자기 자신), shared→(global·shared), global→global.
- **import 위생** — import 자동 정렬(simple-import-sort), 순환 참조 금지(no-cycle), 중복 import 금지. 타입 전용 import는 `import type`.
- **`console.log` 금지** — `console.warn`/`console.error`만 허용.
- **테스트 위생** — `describe.only`/`it.only`/`.skip`/주석처리 테스트 커밋 금지.
- 컴포넌트 폴더 안에 `_hooks/`·`_services/` 중첩 금지.
- 컴포넌트 **파일명** PascalCase는 lint 강제. 컴포넌트 **폴더명**도 PascalCase로 맞출 것(문서 규칙).

## Git hook (Husky)

- `pre-commit` — lint-staged(eslint --fix + prettier)
- `commit-msg` — commitlint (Conventional Commits: `feat:`, `fix:`, `chore:` …)
- `pre-push` — `pnpm typecheck`

훅에서 막히면 위 규칙 위반이다. 우회하지 말고 코드를 고칠 것.

## 데이터 패턴 (TanStack Query)

- `_apis/*.api.ts` — fetch 호출만.
- `_queries/*.queries.ts` — `queryKey` + `queryOptions`만.
- 사용부 — `useQuery(exampleQueries.list())`.
- Provider는 `app/_global/_providers/QueryProvider`, `app/layout.tsx`에서 래핑.

참조 예시: `app/example/`, `app/_global/_apis|_queries|_providers/`.

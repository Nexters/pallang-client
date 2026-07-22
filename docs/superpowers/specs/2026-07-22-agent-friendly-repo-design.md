# 에이전트 친화 Next.js 16 레포 설계

- 날짜: 2026-07-22
- 대상: `pallang-client` (Next.js 16.2.11, pnpm, React 19, Tailwind 4, TypeScript, ESLint 9 flat config)
- 목표: 스파르타 App Router 컨벤션을 lint/hook으로 강제하는, 에이전트가 규칙을 어기기 어려운 레포 구성

## 1. 목표와 원칙

1. **에이전트 친화**: 컨벤션을 문서(AGENTS.md)로 명시하고, 어길 수 없도록 lint/git hook으로 강제한다. 에이전트가 스스로 검증(typecheck/test/build)할 수 있어야 한다.
2. **회사 컨벤션 준수**: 스파르타 App Router 디렉토리 가이드(https://union.spartaclub.kr/contents/app-router-directory/)를 단일 소스로 반영한다.
3. **빡센 기준**: 타입 인지 ESLint(strictTypeChecked) + Prettier + Husky 풀 훅 스택(pre-commit / commit-msg / pre-push).

### 결정 사항 (확정)
- 스타일링: **Tailwind 4 유지**. 컨벤션의 `.css.ts`(vanilla-extract) 접미사 강제는 **적용하지 않음**. 스타일은 className 중심.
- 데이터: **TanStack Query 지금 포함**. `_global/_providers`에 QueryProvider, `_apis`/`_queries` 참조 예시 1세트 포함.

### 비목표 (Non-goals)
- 실제 도메인 기능 구현(페이지/비즈니스 로직)은 범위 밖. 참조용 예시 1세트만 둔다.
- E2E 테스트(Playwright)는 이번 범위 밖. 단위 테스트(Vitest)만.
- vanilla-extract 도입.

## 2. 스파르타 컨벤션 (강제 대상 규칙)

### 최상위 폴더
- `app/_global/` — 앱 전역. 하위: `_components/ _providers/ _hooks/ _queries/ _apis/ _data/ _styles/`
- `app/_shared/` — 2개 이상 지면에서 쓰는 공용 코드, 도메인 단위(`_shared/user/` 등)로 `_components/ _hooks/ _data/`
- `app/(page)/` — 지면 전용 라우트. 하위: `_components/ _hooks/ _services/ _data/ _actions/ _types/ _tests/`
- 판단 기준: 2개 이상 지면 사용 → `_shared/`, 앱 루트 필요 → `_global/`, 모호하면 `_shared/`에 두고 필요 시 이동(co-location).

### 네이밍
| 대상 | 케이스 | 예시 |
|---|---|---|
| 컴포넌트 폴더/파일 | PascalCase | `CourseCard/CourseCard.tsx` |
| 훅·서비스·스토어·쿼리·API | camelCase | `useCourseFilter.ts`, `myCourse.api.ts` |
| URL 경로·API route | kebab-case | `my-course/`, `api/payment-info/` |

### 파일 접미사
| 폴더 | 접미사 |
|---|---|
| `_services/` | `.service.ts` |
| `_data/` | `.store.ts` / `.model.ts` / `.constant.ts` (관심사별 분리, 한 파일에 몰지 않음) |
| `_global/_queries/` | `.queries.ts` |
| `_global/_apis/` | `.api.ts` |
| `_actions/` | `.action.ts` (`'use server'`) |
| `_types/` | `.type.ts` |
| `_tests/` | `.spec.ts` |

### 컴포넌트/모듈 규칙
- 컴포넌트 폴더 안에 `_hooks/`, `_services/` 등 프라이빗 폴더 **중첩 금지**. 특정 컴포넌트 전용 훅도 라우트의 `_hooks/`에 둔다.
- **default export 금지** (Next 특수 파일 예외). 컴포넌트는 named export 1개, 그 외 파일은 여러 함수 허용.
- **배럴 파일(index.ts/tsx) 절대 금지** — 생성·import 모두.
- import 경로: 같은 라우트 내부 → **상대경로**, 공유 코드(`_shared`/`_global`) → **`@/` 절대경로**.
- 서버 쿼리·API는 **무조건 `_global`**. `_apis`(fetch만) / `_queries`(queryKey+queryOptions) 분리.

## 3. 디렉토리 스켈레톤 (생성)

git이 빈 폴더를 추적하지 못하므로, 각 골격 폴더에 참조용 예시 1세트를 넣어 에이전트가 패턴을 복제하게 한다.

```
app/
  _global/
    _providers/QueryProvider/QueryProvider.tsx   # 'use client' + QueryClientProvider
    _apis/example.api.ts                          # fetch 함수 예시
    _queries/example.queries.ts                   # queryOptions 예시
    _components/ _hooks/ _data/ _styles/          # (README 또는 .gitkeep 골격)
  _shared/
    user/_components/ _hooks/ _data/              # 골격
  (example)/
    _components/ExampleCard/ExampleCard.tsx
    _hooks/useExample.ts
    _services/formatExample.service.ts
    _data/example.store.ts
    _actions/exampleAction.action.ts
    _types/example.type.ts
    _tests/example.spec.ts
  layout.tsx  page.tsx  globals.css
```

## 4. 도구 스택 (풀)

패키지/버전은 구현 단계에서 최신 확인 후 pin 한다(특히 아래 ESLint 플러그인 존재·버전 확인).

### Prettier
- `prettier` + `eslint-config-prettier`. `.prettierrc`, `.prettierignore`.
- scripts: `format`(`prettier --write .`), `format:check`.

### ESLint (flat, 강화)
기존 `eslint.config.mjs`(`eslint-config-next/core-web-vitals` + `/typescript`) 위에 레이어링:
- `typescript-eslint` **strictTypeChecked** + **stylisticTypeChecked** (타입 인지 린트 → `languageOptions.parserOptions.projectService: true`).
- 배럴 금지: `eslint-plugin-no-barrel-files` / `eslint-plugin-no-barrel-import` (구현 시 존재 확인; 대안 `no-restricted-imports` 패턴).
- default export 금지: `import/no-default-export`. **예외 override**: `app/**/{page,layout,template,default,error,global-error,loading,not-found,route,sitemap,robots,manifest,opengraph-image,twitter-image,icon,apple-icon}.tsx?`, `middleware.ts`, `instrumentation.ts`, 루트 설정 파일(`*.config.*`).
- 네이밍 강제: `eslint-plugin-check-file`로 폴더별 파일 케이스·접미사 규칙(컴포넌트 PascalCase, 훅/서비스 camelCase + `.service/.queries/.api/.action/.type/.spec`). 스타일 파일(`.css.ts`) 접미사는 **미적용**(Tailwind).
- import 경계: `no-restricted-imports`(또는 `eslint-plugin-import` `no-restricted-paths`)로 "쿼리·API는 `_global`에서만", "라우트 간 딥 import 금지" 등 핵심 규칙.
- scripts: `lint`(`eslint`), `lint:fix`.

### tsconfig 엄격도 상향
기존 `strict: true`에 추가: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`.
- script: `typecheck`(`tsc --noEmit`).

### Husky v9 + lint-staged + commitlint
- `husky init` 후 `.husky/`:
  - **pre-commit** → `lint-staged` (staged: `eslint --fix` + `prettier --write`).
  - **commit-msg** → `commitlint --edit` (`@commitlint/cli` + `@commitlint/config-conventional`, Conventional Commits).
  - **pre-push** → `pnpm typecheck`.
- lint-staged 설정: `package.json` 또는 `.lintstagedrc`.

## 5. 테스트 (Vitest)
- `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `happy-dom` + `@vitejs/plugin-react`.
- `vitest.config.ts` (jsx, alias `@`, `_tests/*.spec.ts` 인식, setup 파일).
- 예시 테스트 1개 → 에이전트가 변경 검증 가능.
- script: `test`(`vitest run`), `test:watch`.

## 6. TanStack Query
- `@tanstack/react-query` 설치.
- `app/_global/_providers/QueryProvider/QueryProvider.tsx` (`'use client'`, QueryClient 생성 + Provider). `app/layout.tsx`에서 감싼다.
- `_apis/example.api.ts`(fetch) + `_queries/example.queries.ts`(queryOptions) 참조 예시.

## 7. Next 16 설정
- `next.config.ts`: `cacheComponents: true` (PPR 기본화, `use cache`/`cacheLife`/`cacheTag` 활성). 검증: 문서 `03-api-reference/05-config/01-next-config-js/cacheComponents.md`.
- `.mcp.json` (루트):
  ```json
  { "mcpServers": { "next-devtools": { "command": "npx", "args": ["-y", "next-devtools-mcp@latest"] } } }
  ```
  dev 서버의 `/_next/mcp` 엔드포인트에 자동 연결. 검증: 문서 `01-app/02-guides/mcp.md`.

## 8. CI & 협업 메타
- `.github/workflows/ci.yml`: pnpm 캐시 → install → `lint` → `typecheck` → `test` → `build` (PR/push).
- `.editorconfig`(2 space, LF, utf-8, 개행 정리).
- `.vscode/settings.json`(formatOnSave, eslint fixAll, default formatter=prettier), `.vscode/extensions.json`(prettier, eslint 권장).
- `.github/pull_request_template.md`.

## 9. AGENTS.md (에이전트용 단일 소스)
기존 "docs 먼저 읽어라" 경고 유지 + 아래를 요약 수록:
- 폴더 구조 규칙과 결정 기준(`_global`/`_shared`/`(page)`).
- 네이밍·접미사 표, default export/배럴 금지, import 경계 규칙.
- 주요 명령어: `pnpm dev/build/lint/lint:fix/typecheck/test/format`.
- 검증 절차: 변경 후 `typecheck` + `test` + `lint`.
- 훅이 무엇을 막는지(커밋/푸시 시 걸리는 이유) 안내.

## 10. 구현 순서 (플랜에서 상세화)
1. Prettier + tsconfig 엄격도 + scripts.
2. ESLint 강화(strictTypeChecked → 배럴/default-export/네이밍/import 경계 순, 각 단계 `lint` 통과 확인).
3. Husky + lint-staged + commitlint.
4. 디렉토리 스켈레톤 + TanStack Query provider/예시.
5. Vitest + 예시 테스트.
6. Next 설정(cacheComponents) + `.mcp.json`.
7. CI + 협업 메타.
8. AGENTS.md 보강.

각 단계 끝에 `pnpm lint && pnpm typecheck && pnpm test && pnpm build`로 회귀 확인.

# 에이전트 친화 레포 세팅 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 스파르타 App Router 컨벤션을 lint/git hook으로 강제하고, Next 16 cacheComponents·devtools MCP·테스트·CI를 갖춘 에이전트 친화 레포를 세팅한다.

**Architecture:** 기존 Create-Next-App 스캐폴드(Next 16.2.11, pnpm, React 19, Tailwind 4, ESLint 9 flat) 위에 도구를 레이어링한다. 컨벤션은 ESLint(strictTypeChecked + 배럴/default-export/네이밍/import 경계)로 강제하고, Husky pre-commit/commit-msg/pre-push로 커밋·푸시 시점에 차단한다. 참조용 디렉토리 스켈레톤 + TanStack Query provider로 패턴을 제시한다.

**Tech Stack:** Next 16.2.11, React 19, TypeScript 5, pnpm, Tailwind 4, ESLint 9(flat), Prettier, Husky v9, lint-staged, commitlint, typescript-eslint, eslint-plugin-check-file, eslint-plugin-no-barrel-files, eslint-plugin-import, Vitest, @testing-library, @tanstack/react-query, GitHub Actions.

## Global Constraints

- 패키지 매니저는 **pnpm** 고정. 모든 설치는 `pnpm add -D` (런타임 의존성만 `pnpm add`).
- Next.js API/설정은 반드시 `node_modules/next/dist/docs/`의 해당 문서를 먼저 확인(AGENTS.md 규칙). 이 버전은 학습 데이터와 다를 수 있음.
- **default export 금지** (Next 특수 파일·설정 파일 예외). **배럴 파일(index.ts/tsx) 절대 금지**.
- 네이밍: 컴포넌트 폴더/파일 **PascalCase**, 훅·서비스·스토어·쿼리·API **camelCase**, URL 경로 **kebab-case**.
- 파일 접미사: `_services/*.service.ts`, `_data/*.{store,model,constant}.ts`, `_global/_queries/*.queries.ts`, `_global/_apis/*.api.ts`, `_actions/*.action.ts`, `_types/*.type.ts`, `_tests/*.spec.ts`.
- import 경로: 같은 라우트 내부 → 상대경로, 공유 코드(`_shared`/`_global`) → `@/` 절대경로. 서버 쿼리·API는 무조건 `_global`.
- 각 태스크 종료 시 회귀 확인: 해당 태스크가 건드린 도구에 맞춰 `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` 중 관련 명령을 돌려 통과 확인.
- 커밋 메시지는 **Conventional Commits** 형식. 커밋 끝에 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- 작업 브랜치: `chore/agent-friendly-setup`.

---

### Task 1: Prettier + tsconfig 엄격도 + 기본 scripts

**Files:**
- Create: `.prettierrc.json`, `.prettierignore`
- Modify: `package.json` (scripts, devDeps), `tsconfig.json` (compilerOptions)

**Interfaces:**
- Produces: `pnpm format`, `pnpm format:check`, `pnpm typecheck` 스크립트. 이후 모든 태스크가 사용.

- [ ] **Step 1: Prettier 설치**

Run: `pnpm add -D prettier eslint-config-prettier`
Expected: `prettier`, `eslint-config-prettier`가 devDependencies에 추가.

- [ ] **Step 2: `.prettierrc.json` 작성**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 3: `.prettierignore` 작성**

```
.next
node_modules
pnpm-lock.yaml
public
coverage
```

- [ ] **Step 4: `tsconfig.json` 엄격도 상향**

`compilerOptions`에 다음 키를 추가한다(기존 `strict: true` 유지):

```jsonc
"noUncheckedIndexedAccess": true,
"noImplicitOverride": true,
"noFallthroughCasesInSwitch": true,
"forceConsistentCasingInFileNames": true
```

- [ ] **Step 5: `package.json` scripts 갱신**

`scripts`를 아래로 교체:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "lint:fix": "eslint --fix",
  "typecheck": "tsc --noEmit",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

- [ ] **Step 6: 전체 포맷 적용 및 검증**

Run: `pnpm format && pnpm format:check && pnpm typecheck`
Expected: format:check → "All matched files use Prettier code style!", typecheck → 에러 없음(종료코드 0).

- [ ] **Step 7: 빌드 회귀 확인**

Run: `pnpm build`
Expected: 빌드 성공.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: add prettier and tighten tsconfig strictness

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: ESLint 타입 인지 강화 (strictTypeChecked)

**Files:**
- Modify: `eslint.config.mjs`, `package.json` (devDeps)

**Interfaces:**
- Consumes: Task 1의 prettier(`eslint-config-prettier`).
- Produces: 타입 인지 린트가 켜진 `eslint.config.mjs` 베이스. Task 3이 이 위에 컨벤션 룰을 얹음.

- [ ] **Step 1: typescript-eslint 설치**

Run: `pnpm add -D typescript-eslint`
Expected: `typescript-eslint`가 devDependencies에 추가.

- [ ] **Step 2: `eslint.config.mjs` 교체**

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // 타입 인지 strict 린트 (ts/tsx 한정)
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 설정/JS 파일은 타입 인지 룰 비활성
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // Prettier와 충돌하는 스타일 룰 비활성 (항상 마지막)
  eslintConfigPrettier,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig
```

- [ ] **Step 3: 린트 실행 및 위반 정리**

Run: `pnpm lint`
Expected: 통과(종료코드 0). 만약 strict 룰이 기본 `app/page.tsx`/`app/layout.tsx`에서 위반을 내면, 각 위반을 코드 수정으로 해결한다(룰 끄지 말 것). "parserOptions.project"/"file not in project" 류 에러가 나면 `**/*.{js,mjs,cjs}` disableTypeChecked 블록이 `postcss.config.mjs`/`eslint.config.mjs`를 커버하는지 확인.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: enable type-aware strict eslint via typescript-eslint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: ESLint 컨벤션 룰 (배럴/default-export/네이밍/import 경계)

**Files:**
- Modify: `eslint.config.mjs`, `package.json` (devDeps)

**Interfaces:**
- Consumes: Task 2의 `eslint.config.mjs`.
- Produces: 스파르타 컨벤션을 강제하는 완성된 ESLint 설정. Task 5 스켈레톤이 이 룰을 통과해야 함.

- [ ] **Step 1: 컨벤션 플러그인 설치**

Run: `pnpm add -D eslint-plugin-no-barrel-files eslint-plugin-check-file eslint-plugin-import`
Expected: 3개 플러그인이 devDependencies에 추가.

- [ ] **Step 2: `eslint.config.mjs`에 컨벤션 블록 추가**

import 추가:

```js
import checkFile from 'eslint-plugin-check-file'
import noBarrelFiles from 'eslint-plugin-no-barrel-files'
import importPlugin from 'eslint-plugin-import'
```

`defineConfig([...])` 배열에서 `eslintConfigPrettier` **앞에** 다음 블록들을 삽입:

```js
  // 배럴 파일 금지
  ...noBarrelFiles.configs.recommended,

  // 컨벤션 룰
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile, import: importPlugin },
    rules: {
      'import/no-default-export': 'error',
      'check-file/filename-naming-convention': [
        'error',
        {
          'app/**/_components/**/*.tsx': 'PASCAL_CASE',
          'app/**/_hooks/**/*.ts': 'CAMEL_CASE',
          'app/**/_services/**/*.ts': 'CAMEL_CASE',
          'app/**/_data/**/*.ts': 'CAMEL_CASE',
          'app/**/_actions/**/*.ts': 'CAMEL_CASE',
          'app/**/_types/**/*.ts': 'CAMEL_CASE',
          'app/**/_queries/**/*.ts': 'CAMEL_CASE',
          'app/**/_apis/**/*.ts': 'CAMEL_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'app/**/_components/*/': 'PASCAL_CASE' },
      ],
    },
  },

  // 서버 상태: 피처 코드에서 _apis 직접 import 금지 (_queries 경유)
  {
    files: ['app/**/*.{ts,tsx}'],
    ignores: ['app/_global/_queries/**', 'app/_global/_apis/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/_apis/*', '@/app/_global/_apis/*'],
              message:
                'API 함수는 직접 import하지 말고 @/app/_global/_queries의 queryOptions를 사용하세요.',
            },
          ],
        },
      ],
    },
  },

  // Next 특수 파일 / 설정 파일은 default export 허용
  {
    files: [
      'app/**/{page,layout,template,default,error,global-error,loading,not-found,route,sitemap,robots,manifest,opengraph-image,twitter-image,icon,apple-icon}.{ts,tsx}',
      '**/middleware.ts',
      '**/instrumentation.ts',
      '**/*.config.{js,mjs,ts}',
      'next-env.d.ts',
    ],
    rules: { 'import/no-default-export': 'off' },
  },
```

- [ ] **Step 3: 린트 실행 (현재 트리는 page/layout만 있으므로 통과해야 함)**

Run: `pnpm lint`
Expected: 통과. `app/page.tsx`·`app/layout.tsx`는 default export이지만 Next 특수 파일 예외로 통과. 만약 check-file 룰 스키마 에러가 나면 플러그인 버전(v3+)과 rule 키(`check-file/filename-naming-convention`)를 재확인.

- [ ] **Step 4: 룰 동작 스모크 테스트 (임시 위반 파일)**

Run:
```bash
printf "export default 1\n" > app/_smoke.ts
pnpm lint app/_smoke.ts; echo "exit=$?"
rm app/_smoke.ts
```
Expected: default export 위반으로 lint 실패(exit 비-0) → 룰이 실제로 동작함을 확인. 확인 후 파일 삭제.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: enforce sparta conventions via eslint (barrel/default-export/naming/imports)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Husky + lint-staged + commitlint

**Files:**
- Create: `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`, `commitlint.config.mjs`, `.lintstagedrc.json`
- Modify: `package.json` (devDeps, `prepare` script, `packageManager`)

**Interfaces:**
- Consumes: Task 1~3의 `lint`/`typecheck`/`format`.
- Produces: 커밋/푸시 시 컨벤션 자동 차단.

- [ ] **Step 1: 도구 설치**

Run: `pnpm add -D husky lint-staged @commitlint/cli @commitlint/config-conventional`
Expected: 4개 패키지 추가.

- [ ] **Step 2: packageManager 필드 고정 (CI/훅 재현성)**

Run: `pnpm --version`
그 값을 사용해 `package.json`에 추가(예: 버전이 `9.15.0`이면):

```json
"packageManager": "pnpm@9.15.0"
```

- [ ] **Step 3: Husky 초기화**

Run: `pnpm exec husky init`
Expected: `.husky/` 생성, `package.json`에 `"prepare": "husky"` 추가, 샘플 `.husky/pre-commit` 생성(다음 스텝에서 덮어씀).

- [ ] **Step 4: `.lintstagedrc.json` 작성**

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,mjs,cjs,json,md,css}": ["prettier --write"]
}
```

- [ ] **Step 5: `commitlint.config.mjs` 작성**

```js
export default { extends: ['@commitlint/config-conventional'] }
```

- [ ] **Step 6: 훅 파일 작성 (Husky v9 — 명령만 기술)**

`.husky/pre-commit`:
```sh
pnpm exec lint-staged
```

`.husky/commit-msg`:
```sh
pnpm exec commitlint --edit "$1"
```

`.husky/pre-push`:
```sh
pnpm typecheck
```

- [ ] **Step 7: 훅 실행권한 부여**

Run: `chmod +x .husky/pre-commit .husky/commit-msg .husky/pre-push`
Expected: 에러 없음.

- [ ] **Step 8: commitlint 동작 확인**

Run:
```bash
echo "bad message" | pnpm exec commitlint; echo "exit=$?"
echo "feat: valid message" | pnpm exec commitlint; echo "exit=$?"
```
Expected: 첫 번째는 실패(exit 비-0, "subject" 등 에러), 두 번째는 통과(exit 0).

- [ ] **Step 9: Commit (훅이 실제로 걸리는지 겸사 확인)**

```bash
git add -A
git commit -m "chore: add husky hooks with lint-staged and commitlint

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
Expected: pre-commit(lint-staged)·commit-msg(commitlint) 통과 후 커밋 생성.

---

### Task 5: 디렉토리 스켈레톤 + TanStack Query provider + 참조 예시

**Files:**
- Create (전역): `app/_global/_providers/QueryProvider/QueryProvider.tsx`, `app/_global/_data/example.model.ts`, `app/_global/_apis/example.api.ts`, `app/_global/_queries/example.queries.ts`
- Create (공유 골격): `app/_shared/user/.gitkeep` (또는 README)
- Create (피처 예시): `app/example/page.tsx`, `app/example/_components/ExampleCard/ExampleCard.tsx`, `app/example/_hooks/useExample.ts`, `app/example/_services/formatExample.service.ts`, `app/example/_data/example.store.ts`, `app/example/_actions/createExample.action.ts`, `app/example/_types/example.type.ts`
- Modify: `app/layout.tsx` (QueryProvider 래핑), `package.json` (`@tanstack/react-query`)

**Interfaces:**
- Produces: `QueryProvider`(children: ReactNode), `Example` 타입(`{ id: string; label: string }`), `formatExample(label: string): string`, `createExample(label: string): Promise<{ label: string }>`, `useExample(initial: Example[]): { items: Example[] }`, `ExampleCard({ item: Example })`.

- [ ] **Step 1: TanStack Query 설치**

Run: `pnpm add @tanstack/react-query`
Expected: dependencies에 추가.

- [ ] **Step 2: 타입 정의**

`app/example/_types/example.type.ts`:
```ts
export type Example = {
  id: string
  label: string
}
```

- [ ] **Step 3: 전역 모델**

`app/_global/_data/example.model.ts`:
```ts
// 참조용 예시 — 실제 도메인 모델로 교체하세요.
export type ExampleDto = {
  id: string
  label: string
}
```

- [ ] **Step 4: API 함수 (_global/_apis)**

`app/_global/_apis/example.api.ts`:
```ts
// 참조용 예시 — fetch 호출만 담당. 실제 API로 교체하세요.
import type { ExampleDto } from '../_data/example.model'

export async function fetchExamples(): Promise<ExampleDto[]> {
  const res = await fetch('/api/examples')
  if (!res.ok) throw new Error('Failed to fetch examples')
  return res.json() as Promise<ExampleDto[]>
}
```

- [ ] **Step 5: 쿼리 정의 (_global/_queries)**

`app/_global/_queries/example.queries.ts`:
```ts
// 참조용 예시 — queryKey + queryOptions만 정의.
import { queryOptions } from '@tanstack/react-query'
import { fetchExamples } from '../_apis/example.api'

export const exampleQueries = {
  all: () => ['example'] as const,
  list: () =>
    queryOptions({
      queryKey: [...exampleQueries.all(), 'list'],
      queryFn: fetchExamples,
    }),
}
```

- [ ] **Step 6: QueryProvider (_global/_providers)**

`app/_global/_providers/QueryProvider/QueryProvider.tsx`:
```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

- [ ] **Step 7: layout.tsx에 QueryProvider 래핑**

`app/layout.tsx`의 `<body>` 내부 `{children}`을 감싼다. 공유 코드이므로 `@/` 절대경로로 import:
```tsx
import { QueryProvider } from '@/app/_global/_providers/QueryProvider/QueryProvider'
```
그리고 body 내부를 `<QueryProvider>{children}</QueryProvider>`로 감싼다. (기존 `<html>`/`<body>`/폰트 설정·metadata·default export는 유지 — layout은 Next 특수 파일이라 default export 허용.)

- [ ] **Step 8: 피처 예시 파일들**

`app/example/_services/formatExample.service.ts`:
```ts
export function formatExample(label: string): string {
  return `example: ${label}`
}
```

`app/example/_data/example.store.ts`:
```ts
import type { Example } from '../_types/example.type'

export const exampleSeed: Example[] = [{ id: '1', label: 'hello' }]
```

`app/example/_hooks/useExample.ts`:
```ts
'use client'

import { useState } from 'react'
import type { Example } from '../_types/example.type'

export function useExample(initial: Example[]): { items: Example[] } {
  const [items] = useState(initial)
  return { items }
}
```

`app/example/_actions/createExample.action.ts`:
```ts
'use server'

export async function createExample(label: string): Promise<{ label: string }> {
  await Promise.resolve()
  return { label }
}
```

`app/example/_components/ExampleCard/ExampleCard.tsx`:
```tsx
import type { Example } from '../../_types/example.type'
import { formatExample } from '../../_services/formatExample.service'

export function ExampleCard({ item }: { item: Example }) {
  return <div>{formatExample(item.label)}</div>
}
```

`app/example/page.tsx`:
```tsx
import { ExampleCard } from './_components/ExampleCard/ExampleCard'
import { exampleSeed } from './_data/example.store'

export default function ExamplePage() {
  return (
    <main>
      {exampleSeed.map((item) => (
        <ExampleCard key={item.id} item={item} />
      ))}
    </main>
  )
}
```

- [ ] **Step 9: 공유 골격 placeholder**

`app/_shared/user/.gitkeep` 빈 파일 생성(빈 도메인 폴더를 git이 추적하도록). 파일 내용 없이 존재만.

- [ ] **Step 10: 린트/타입/빌드 검증**

Run: `pnpm lint && pnpm typecheck && pnpm build`
Expected: 모두 통과. 위반 시:
- check-file 네이밍 위반 → 파일/폴더명 케이스 확인.
- `import/no-default-export` 위반 → page/layout 외 파일에 default export가 없는지 확인.
- strictTypeChecked 위반(예: `no-unsafe-*`, `require-await`) → 코드로 해결(룰 끄지 말 것).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: scaffold sparta app-router skeleton with tanstack query

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Vitest + 예시 테스트

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`, `app/example/_tests/example.spec.ts`
- Modify: `package.json` (devDeps, `test`/`test:watch` scripts), `eslint.config.mjs` (설정 파일 default export 예외에 이미 `*.config.ts` 포함 — 확인만)

**Interfaces:**
- Consumes: Task 5의 `formatExample`.
- Produces: `pnpm test` 검증 루프.

- [ ] **Step 1: Vitest 스택 설치**

Run: `pnpm add -D vitest @vitejs/plugin-react happy-dom @testing-library/react @testing-library/jest-dom`
Expected: devDependencies에 추가.

- [ ] **Step 2: `vitest.config.ts` 작성**

```ts
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.spec.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
```

- [ ] **Step 3: `vitest.setup.ts` 작성**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: `package.json`에 test scripts 추가**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: 예시 테스트 작성 (실패 먼저 확인)**

`app/example/_tests/example.spec.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { formatExample } from '../_services/formatExample.service'

describe('formatExample', () => {
  it('라벨 앞에 example: 를 붙인다', () => {
    expect(formatExample('hi')).toBe('example: hi')
  })
})
```

- [ ] **Step 6: 테스트 실행**

Run: `pnpm test`
Expected: 1 passed. (happy-dom 환경 로딩 에러가 나면 `environment` 값과 happy-dom 설치 확인.)

- [ ] **Step 7: 린트 회귀 (테스트/설정 파일 포함)**

Run: `pnpm lint`
Expected: 통과. `vitest.config.ts`의 default export는 `*.config.ts` 예외로 허용. `example.spec.ts`는 default export 없음.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: add vitest setup with example spec

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Next 16 설정 — cacheComponents + devtools MCP

**Files:**
- Modify: `next.config.ts`
- Create: `.mcp.json`

**Interfaces:**
- Produces: PPR/`use cache` 활성화, 코딩 에이전트용 MCP 연결.

참고 문서(반드시 확인): `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/cacheComponents.md`, `node_modules/next/dist/docs/01-app/02-guides/mcp.md`.

- [ ] **Step 1: `next.config.ts`에 cacheComponents 활성화**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

- [ ] **Step 2: 빌드 검증 (PPR 기본화 영향 확인)**

Run: `pnpm build`
Expected: 빌드 성공. cacheComponents는 데이터 fetch를 기본 dynamic으로 만들지만, 현재 예시 페이지는 정적 콘텐츠라 통과. 만약 "dynamic API를 use cache/Suspense 없이 사용" 류 에러가 나면 해당 문서(`08-caching.md`)를 따라 Suspense 경계 또는 `use cache`를 추가.

- [ ] **Step 3: `.mcp.json` 작성**

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

- [ ] **Step 4: dev 서버로 MCP 엔드포인트 확인 (선택)**

Run: `pnpm dev` 로 서버를 띄운 뒤 별도 터미널에서 `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/_next/mcp` 로 응답 확인(200/405 등 라우트 존재 신호). 확인 후 dev 서버 종료.
Expected: `/_next/mcp` 라우트가 404가 아님(엔드포인트 존재). 상황상 생략 가능.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: enable next 16 cacheComponents and next-devtools mcp

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: CI + 협업 메타

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `.editorconfig`, `.vscode/settings.json`, `.vscode/extensions.json`

**Interfaces:**
- Consumes: `pnpm lint/typecheck/test/build`, `packageManager` 필드(Task 4).

- [ ] **Step 1: `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 2: `.vscode/settings.json`**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "eslint.useFlatConfig": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

- [ ] **Step 3: `.vscode/extensions.json`**

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss"
  ]
}
```

- [ ] **Step 4: `.github/pull_request_template.md`**

```markdown
## 요약

## 변경 사항

## 체크리스트
- [ ] `pnpm lint` 통과
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm test` 통과
- [ ] 스파르타 App Router 컨벤션 준수 (폴더/네이밍/배럴 금지/default export 금지)
```

- [ ] **Step 5: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 6: 로컬에서 CI 명령 재현 검증**

Run: `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: 전부 통과. `--frozen-lockfile` 실패 시 lockfile을 커밋했는지 확인.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "ci: add github actions pipeline and editor/collab meta

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: AGENTS.md 보강 (에이전트용 단일 소스)

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: 전체 세팅 결과(명령어·컨벤션·훅).

- [ ] **Step 1: `AGENTS.md` 재작성**

기존 "이 Next.js는 다르다 / docs 먼저 읽어라" 경고를 유지하면서 아래를 추가한다. 전체 내용:

```markdown
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

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
- 배치 판단: 2곳 이상 사용 → `_shared`, 앱 루트 필요 → `_global`, 모호하면 `_shared`부터.

## 네이밍 & 접미사

- 컴포넌트 폴더/파일: `PascalCase` (`ExampleCard/ExampleCard.tsx`)
- 훅·서비스·스토어·쿼리·API: `camelCase`
- URL 경로: `kebab-case`
- 접미사: `.service.ts` / `.store.ts`·`.model.ts`·`.constant.ts` / `.queries.ts` / `.api.ts` / `.action.ts` / `.type.ts` / `.spec.ts`

## 금지 & 강제 (lint로 차단됨)

- **default export 금지** — Next 특수 파일(page/layout 등)·설정 파일만 예외. 컴포넌트는 named export 1개.
- **배럴 파일(index.ts/tsx) 금지** — 생성·import 모두.
- **import 경로** — 같은 라우트 내부는 상대경로, `_shared`/`_global`은 `@/` 절대경로.
- **피처 코드에서 `_apis` 직접 import 금지** — `@/app/_global/_queries`의 queryOptions 사용.
- 컴포넌트 폴더 안에 `_hooks/`·`_services/` 중첩 금지.

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
```

- [ ] **Step 2: 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: 전부 통과(문서 변경이라 회귀 없음 확인).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: enrich AGENTS.md with conventions, commands, and hooks

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## 최종 검증 (전체 태스크 완료 후)

- [ ] `pnpm install --frozen-lockfile && pnpm lint && pnpm typecheck && pnpm test && pnpm build` 전부 통과
- [ ] 임시 위반 파일로 각 lint 룰이 실제 차단하는지 스모크 확인(배럴/default-export/네이밍)
- [ ] 잘못된 커밋 메시지가 commit-msg 훅에서 차단되는지 확인
- [ ] `.mcp.json`이 루트에 있고 dev 서버에서 `/_next/mcp` 응답

## 자기 검토 결과 (spec 대비)

- spec §2 컨벤션 → Task 3(lint 강제) + Task 9(문서) 커버.
- spec §3 스켈레톤 → Task 5 커버.
- spec §4 도구(prettier/eslint/husky) → Task 1·2·3·4 커버.
- spec §5 테스트 → Task 6 커버.
- spec §6 TanStack Query → Task 5 커버.
- spec §7 Next 설정 → Task 7 커버.
- spec §8 CI/메타 → Task 8 커버.
- spec §9 AGENTS.md → Task 9 커버.
- 미커버 없음. 스타일 파일 `.css.ts` 접미사 강제는 spec 결정대로 미적용(Tailwind).

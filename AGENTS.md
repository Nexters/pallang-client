<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## 명령어

- `pnpm dev` — 개발 서버 (MCP 엔드포인트 `/_next/mcp` 포함)
- `pnpm build` — 프로덕션 빌드 (cacheComponents/PPR 활성)
- `pnpm lint` / `pnpm lint:fix` — ESLint (타입 인지 strict + 컨벤션)
- `pnpm typecheck` — TypeScript 검사 (`tsc --noEmit`)
- `pnpm test` / `pnpm test:watch` — Vitest
- `pnpm format` / `pnpm format:check` — Prettier 쓰기/검사

  **코드 변경 후 반드시 `pnpm lint && pnpm typecheck && pnpm test`로 검증할 것. 문서만 변경한 경우 검증 생략 가능.**

## 디렉토리 규칙

- `app/_global/` — 앱 전역 코드. 하위 폴더: `_providers/ _components/ _hooks/ _services/ _queries/ _apis/ _data/ _styles/`.
- `app/_shared/<domain>/` — 2개 이상 route에서 실제 재사용하는 도메인 공용 코드. 하위 폴더: `_components/ _hooks/ _data/`.
- `app/<kebab-route>/` — 특정 route 전용 코드. 하위 폴더: `_components/ _hooks/ _services/ _data/ _actions/ _types/ _tests/`.
- 기본 배치: route-local 우선. 실제 재사용 시 `_shared`, 앱 전역 인프라는 `_global`.
- 공용 코드 배치: route 트리의 최소 공통 부모가 아니라 `app/_shared/<domain>/`로 이동.
- 중첩 금지: 컴포넌트 폴더 내부에 `_hooks/`, `_services/` 같은 프라이빗 폴더를 만들지 않는다.
- 서버 쿼리(`.queries.ts`)와 API 호출 함수(`.api.ts`)는 route-local이나 `_shared`에 두지 않고 `app/_global/_queries`, `app/_global/_apis`에 둔다.

## 네이밍 & 접미사

- 컴포넌트 폴더/파일: `PascalCase`. 예: `ExampleCard/ExampleCard.tsx`.
- 일반 TS 파일: `camelCase`. 훅·서비스·스토어·모델·상수·쿼리·API·액션·타입·테스트에 적용.
- URL 경로 및 API route: `kebab-case`. 예: `my-course/`, `api/payment-info/`.
- 역할 접미사: `.service.ts`, `.store.ts`, `.model.ts`, `.constant.ts`, `.queries.ts`, `.api.ts`, `.action.ts`, `.type.ts`, `.spec.ts`.
- `_data/`는 store/model/constant를 파일 단위로 분리한다.
- 객체 타입은 `type` 별칭을 사용한다.

## 금지 & 강제

- **default export 금지** — named export만 사용한다. 단, Next 특수 파일(`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts` 등)과 설정 파일은
  예외다.
- **컴포넌트 export 제한** — 컴포넌트 파일은 하나의 컴포넌트만 export한다. 내부 헬퍼 함수/상수는 export하지 않는다.
- **배럴 파일 금지** — `index.ts`/`index.tsx` 생성과 import를 금지한다.
- **import 경로** — 같은 route 내부 코드는 상대경로를 사용하고, `_shared`/`_global` 코드는 `@/` 절대경로를 사용한다.
- **API 직접 import 금지** — feature 코드에서 `_apis`를 직접 import하지 않는다. `@/app/_global/_queries`의 queryOptions를 사용한다.
- **아키텍처 경계** — feature끼리 서로 import하지 않는다. `_global`/`_shared`는 feature를 역참조하지 않는다. 허용: feature→(global·shared·자기 자신),
  shared→(global·shared), global→global.
- **import 규칙** — simple-import-sort 정렬, 순환 참조 금지, 중복 import 금지. 타입 전용 import는 `import type`을 사용한다.
- **로그 제한** — `console.log`는 금지한다. `console.warn`/`console.error`만 허용한다.
- **테스트 금지 패턴** — `describe.only`/`it.only`/`.skip`/주석 처리한 테스트를 커밋하지 않는다.
- **컴포넌트 구조** — 컴포넌트 폴더 내부에 `_hooks/`, `_services/` 같은 프라이빗 폴더를 중첩하지 않는다.
- **컴포넌트 네이밍** — 컴포넌트 파일명과 폴더명은 `PascalCase`로 맞춘다.

## 이슈 / 브랜치 / PR 컨벤션

- 태스크마다 GitHub 이슈를 먼저 만든다. `.github/ISSUE_TEMPLATE` 템플릿을 사용한다.
- 브랜치는 이슈 번호 기반으로 만든다: `feat/<이슈번호>-<슬러그>`. 예: `feat/10-button-component`.
- PR은 `main`으로 올린다. 제목은 `작업 내용 요약 (#이슈번호)`, 본문에 `Closes #<이슈번호>`를 포함해 머지 시 이슈가 자동으로 닫히게 한다.

## Git hook (Husky)

- `pre-commit` — staged 파일에 `lint-staged` 실행. TS/TSX는 `eslint --fix` + `prettier --write`, JS/JSON/MD/CSS 등은 `prettier --write`.
- `commit-msg` — commitlint로 Conventional Commits 형식 검사. 예: `feat:`, `fix:`, `chore:`.
- `pre-push` — `pnpm typecheck` 실행.

훅 실패는 코드/포맷/타입/커밋 메시지 규칙 위반으로 보고, 우회하지 말고 원인을 수정한다. 훅은 staged 파일 중심의 최소 안전망이므로 코드 변경 후에는 별도 검증 명령을 실행한
다.

## 데이터 패턴 (TanStack Query)

- API 호출 함수는 `app/_global/_apis/*.api.ts`에 둔다. `_apis` 파일은 fetch 호출만 담당한다.
- 서버 쿼리는 `app/_global/_queries/*.queries.ts`에 둔다. `_queries` 파일은 `queryKey`와 `queryOptions`만 정의하고 `useQuery`를 호출하지 않는다.
- 사용부에서는 `useQuery(exampleQueries.list())`처럼 `_queries`의 queryOptions를 주입해 호출한다.
- feature 코드에서 `_apis`를 직접 import하지 않는다. 서버 상태 조회는 `@/app/_global/_queries`를 경유한다.
- `QueryProvider`는 `app/_global/_providers/QueryProvider`에 두고 `app/layout.tsx`에서 래핑한다.
- TanStack Query의 queryKey 설계, mutation, invalidation, prefetch/dehydrate 규칙은 `.agents/tanstack-query.md`를 만들어 별도로 관리한다.

## 아이콘

- 아이콘은 `app/_global/_components/Icon/assets/*.svg`(kebab-case)에 두고 SVGR로 컴포넌트처럼 import해서 쓴다. 색은 `currentColor` 기반.
- 새 아이콘 추가 절차와 SVG 정리 규칙, 빌드 설정(next/turbopack·storybook/vite·`svg.d.ts`)은 `.agents/icons.md`를 따른다.

참조 예시: `app/example/`, `app/_global/_apis`, `app/_global/_queries`, `app/_global/_providers/`.

## Capacitor (웹뷰 앱, iOS · Android)

이 웹은 Capacitor로 iOS/Android 웹뷰 앱화되어 있다(원격 URL 로드, 카메라). **네이티브 빌드/기기 검증 전 반드시 [docs/capacitor.md](docs/capacitor.md)를 읽을 것.** 특히 함정:

- **`next dev`는 WKWebView에서 하이드레이션이 안 된다**(브라우저·Android는 정상). 웹뷰/기기 테스트는 `pnpm build && pnpm start`(프로덕션)로 한다.
- **(iOS)** Xcode GUI로 프로젝트를 열면 pbxproj가 손상되어 `Undefined symbol: _main`이 난다. `ios/`를 재생성하고 `xcodebuild`/`cap` CLI로 빌드한다.
- **(Android)** APK 빌드에 **JDK 21** 필요(카메라 플러그인 요구). dev(http) 로드는 debug 매니페스트의 `usesCleartextTraffic`로 허용.

기기에서 dev 서버를 띄울 때 LAN IP는 네트워크마다 바뀐다. IP를 앱에 하드코딩하지 말고 스크립트로 현재 IP를 자동 감지해 실행한다:

- `pnpm cap:dev:ios` — 현재 LAN IP 자동 감지 → sync → iOS 실행
- `pnpm cap:dev:android` — Android 에뮬레이터(호스트 `10.0.2.2`)로 sync → 실행
- `pnpm cap:dev:sync` — 빌드·실행 없이 URL만 갱신(웹만 바꿨을 때, 앱에서 새로고침). 웹 변경엔 케이블 불필요, 재설치(IP·네이티브 변경) 시에만 필요.

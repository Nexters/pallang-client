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
- `pnpm api:gen` — orval로 OpenAPI 스펙에서 API 클라이언트 생성 (`app/_global/_apis/_generated/`, 생성물 커밋, 수동 수정 금지)

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

- 사용자가 이슈 생성을 요청하면 반드시 `.agents/issue-workflow.md`를 읽고 이슈 작성, 담당자 지정 및 브랜치 생성 절차를 따른다.
- 사용자가 PR 생성을 요청하면 반드시 `.agents/pr-workflow.md`를 읽고 변경 검토, 검증, 초안 승인 및 PR 생성 절차를 따른다.
- 사용자가 운영 배포/릴리스를 요청하면 **반드시 `deploy-release` 스킬(`.claude/skills/deploy-release/SKILL.md`)을 읽고 그 절차대로만 배포한다.** `release` 브랜치가 Vercel Production, `develop`이 dev 환경이다. `release`로 가는 push·머지를 스킬 절차 없이 임의로 실행하지 않는다.

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

## Safe area (노치 인셋)

- 상단 인셋 토큰은 `globals.css`의 `:root { --safe-top: env(safe-area-inset-top, 0px) }` 하나뿐이다. 화면 코드에서 `env(safe-area-inset-top)`을 직접 쓰지 않는다 — 셸 패딩과 겹쳐 두 번 내려간다.
- 레이아웃 셸(`app/layout.tsx`의 `main`)이 `pt-(--safe-top)`으로 일괄 소비한다 — **새 페이지는 노치 처리를 하지 않는다.**
- 노치 뒤까지 배경을 깔아야 하는 풀블리드 화면만 `-mt-(--safe-top)`(CSS는 `margin-top: calc(-1 * var(--safe-top))`)으로 셸 패딩을 되돌린 뒤 내부에서 직접 오프셋한다. 예: 탭 화면(`TabScreenLayout` — 시트가 되돌리고 `pt-(--safe-top)`으로 다시 더한다), 흔적 페이지(`TraceCollapseView`/`QuoteStage`).
- `fixed` 오버레이는 셸 패딩을 받지 않는다 — 상단에 콘텐츠가 붙는 오버레이만 `var(--safe-top)`만큼 패딩한다. 예: `TraceDetailOverlay`. 중앙 정렬 모달·바텀시트는 처리 불필요.
- 하단 인셋 토큰은 `--safe-bottom`이다. 상단과 달리 **셸이 소비하지 않는다** — 하단에 붙는 요소(탭바·고정 CTA·바텀시트)가 각자 `max(<기본값>, var(--safe-bottom))`으로 더한다. `env(safe-area-inset-bottom)`을 직접 쓰지 않는다.
- **두 토큰 모두 값을 env()에서만 받지 않는다.** Android는 시스템 바 인셋을 `env(safe-area-inset-*)`로 주지 않는 웹뷰(Chromium < 140)가 있어 `MainActivity`가 실제 인셋을 두 토큰에 덮어쓴다(API 35+에서만 — 그 아래는 창이 시스템 바를 침범하지 않아 넣으면 두 번 밀린다). 그래서 인셋은 언제나 토큰을 거쳐 읽는다.

## 모션 (애니메이션 토큰)

- duration·easing은 `globals.css`의 토큰만 쓴다. `duration-200`, `ease-[cubic-bezier(...)]` 같은 임의값은 금지다 — `motionConvention.spec.ts`가 `app/**/*.tsx`를 훑어 막는다.
  - duration: `duration-instant`(120ms 프레스·색) · `duration-fast`(180ms 백드롭·토스트·팝오버) · `duration-normal`(240ms 모달·바텀시트) · `duration-slow`(350ms 전체화면 전환)
  - easing: `ease-enter`(등장) · `ease-exit`(퇴장) · `ease-standard`(상태 전환)
- **`@keyframes` / `animate-*`를 새로 만들지 않는다.** 움직임 축소 대응이 `@media (prefers-reduced-motion) { :root { --duration-*: 1ms } }` 로 동작하므로, duration이 선언에 박히는 keyframes는 이 정책을 빠져나간다. 등장/퇴장은 전부 `transition`으로 만든다.
- **Tailwind v4에서 `scale-*` / `translate-*`는 `transform`이 아니라 `scale` / `translate` 속성으로 컴파일된다.** `transition-[opacity,transform]`으로는 크기·이동이 전혀 전환되지 않는다. `transition-[opacity,scale]`처럼 실제 속성 이름을 쓰거나 `transition-transform`(네 속성을 모두 포함)을 쓴다.
- JS에서 duration이 필요하면 `app/_global/_data/motion.constant.ts`의 `MOTION_DURATION`을 쓴다. CSS와 값이 어긋나면 `motionToken.spec.ts`가 잡는다.
- **모달·바텀시트는 새로 만들지 않는다.** `_components/Dialog`(중앙 모달)와 `_components/BottomSheet`(하단 시트)를 쓴다. 둘 다 base-ui 위에 있어 포커스 트랩·스크롤 락·Esc·바깥 탭 닫힘이 딸려 온다. `fixed inset-0`으로 직접 오버레이를 만들지 말 것.
- base-ui를 쓰지 않는 오버레이(전체화면 상세, 팝오버, 스플래시)의 등장/퇴장은 `useExitTransition(open, MOTION_DURATION.x)`으로 수명을 관리하고 `data-state`로 스타일을 건다. 닫히는 동안 내용이 비지 않아야 하면 `useLastPresent`를 같이 쓴다. 퇴장 중에도 오버레이는 화면에 남으므로 `data-[state=exiting]:pointer-events-none`으로 클릭을 흘려보낸다.
- 탭 가능한 요소에는 `press` 유틸을 붙여 누르는 피드백을 통일한다. `transition-colors`와 같이 쓰면 `transition-property`가 서로를 덮으니 한쪽으로 합친다.
- 파일을 읽어 검사하는 spec은 첫 줄에 `// @vitest-environment node`를 단다. 기본 `happy-dom` 환경에서는 vite가 `import.meta.url`을 재작성해 `fileURLToPath`가 깨진다.

## Capacitor (웹뷰 앱, iOS · Android)

이 웹은 Capacitor로 iOS/Android 웹뷰 앱화되어 있다(원격 URL 로드, 카메라). **네이티브 빌드/기기 검증 전 반드시 [docs/capacitor.md](docs/capacitor.md)를 읽을 것.** 특히 함정:

- **`next dev`는 WKWebView에서 하이드레이션이 안 된다**(브라우저·Android는 정상). 웹뷰/기기 테스트는 `pnpm build && pnpm start`(프로덕션)로 한다.
- **(iOS)** Xcode GUI로 프로젝트를 열면 pbxproj가 손상되어 `Undefined symbol: _main`이 난다. `ios/`를 재생성하고 `xcodebuild`/`cap` CLI로 빌드한다.
- **(Android)** APK 빌드에 **JDK 21** 필요(카메라 플러그인 요구). dev(http) 로드는 debug 매니페스트의 `usesCleartextTraffic`로 허용.
- **네이티브가 준 파일 경로(`capacitor://localhost/...`)를 `fetch`로 읽을 수 없다.** 원격 URL을 로드하므로 교차 오리진이다. 카메라·파일 플러그인은 경로 대신 데이터(`DataUrl` 등)로 받는다. 이미지 표시는 되고 바이트 읽기만 막혀서 놓치기 쉽다.

기기에서 dev 서버를 띄울 때 LAN IP는 네트워크마다 바뀐다. IP를 앱에 하드코딩하지 말고 스크립트로 현재 IP를 자동 감지해 실행한다:

- `pnpm cap:dev:ios` — 현재 LAN IP 자동 감지 → sync → iOS 실행
- `pnpm cap:dev:android` — Android 에뮬레이터(호스트 `10.0.2.2`)로 sync → 실행
- `pnpm cap:dev:sync` — 빌드·실행 없이 URL만 갱신(웹만 바꿨을 때, 앱에서 새로고침). 웹 변경엔 케이블 불필요, 재설치(IP·네이티브 변경) 시에만 필요.

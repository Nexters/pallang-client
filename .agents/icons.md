# 아이콘 가이드

디자인 시스템 아이콘은 **원본 SVG 파일 + SVGR 컴포넌트 변환** 방식으로 관리한다.

## 구조

```
app/_global/_components/Icon/
├── assets/           # 아이콘 원본 SVG (kebab-case)
│   ├── camera.svg
│   ├── book-add.svg
│   └── ...
└── Icon.stories.tsx  # 전체 아이콘 그리드 스토리 (클릭 시 사용 코드 복사)
```

## 사용법

SVG를 import하면 SVGR이 React 컴포넌트로 변환한다. 별도 래퍼 컴포넌트 없이 직접 사용한다.

```tsx
import CameraIcon from '@/app/_global/_components/Icon/assets/camera.svg'

// 기본 색은 text-icon-primary (SVGR svgProps로 주입, currentColor 기반)
<CameraIcon />

// 다른 색이 필요하면 className으로 오버라이드
<CameraIcon className="text-icon-active" />

// 크기는 width/height props로 재정의 (기본 24)
<CameraIcon width={16} height={16} />
```

## 새 아이콘 추가 절차

1. 피그마에서 아이콘 **프레임 노드**를 SVG로 export한다.
   - 프레임째 export하면 배경 렉트·컴포넌트셋 테두리가 섞여 나올 수 있다. `<svg>` 루트 바로 아래에 아이콘 벡터만 남기고 제거한다.
2. SVG를 정리한다.
   - `viewBox="0 0 24 24"`, `width="24" height="24"`, 루트에 `fill="none"`
   - 모든 단색 `fill`/`stroke` 값(`#222222`, `white` 등)은 `currentColor`로 치환
   - `id` 속성 제거
3. `app/_global/_components/Icon/assets/<kebab-case>.svg`로 저장한다.
4. `Icon.stories.tsx`의 import와 `ICONS` 배열에 추가한다 (컴포넌트명은 `PascalCase + Icon` 접미사, 예: `book-add.svg` → `BookAddIcon`).
5. `pnpm lint && pnpm typecheck && pnpm test`로 검증하고, `pnpm storybook`에서 렌더링을 확인한다.

## 빌드 설정 (변경 시 주의)

svg import가 컴포넌트로 동작하는 것은 아래 세 가지 설정에 의존한다.

- `next.config.ts` — `turbopack.rules`의 `*.svg` → `@svgr/webpack` 룰. 글롭은 파일명 기반 `*.svg`여야 한다 (`app/**/*.svg` 같은 경로 글롭은 매칭되지 않아 svg가 static image 객체로 import되고 "Element type is invalid: ... got: object" 런타임 에러가 난다). `svgProps: { className: 'text-icon-primary' }`로 기본 색을 주입한다 (`.storybook/main.ts`의 `svgrOptions`와 동일하게 유지). `svgo: false` 필수 — SVGO가 viewBox를 제거하면 width/height 재정의 시 스케일되지 않고 잘린다. `images.disableStaticImages: true`는 Next 기본 `*.svg` 타입(any) 주입이 `svg.d.ts`와 충돌하는 것을 막기 위한 것이므로 제거하지 않는다.
- `svg.d.ts` — `*.svg` import를 `FC<SVGProps<SVGSVGElement>>`로 타입 선언.
- `.storybook/main.ts` — `viteFinal`의 `vite-plugin-svgr`. `@storybook/nextjs-vite`가 svg import에 `?ignore` 쿼리를 붙이므로 include는 쿼리까지 매칭하는 정규식이어야 한다.

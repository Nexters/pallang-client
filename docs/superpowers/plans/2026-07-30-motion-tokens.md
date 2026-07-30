# 모션 토큰 디자인 시스템 + 오버레이 공통화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** duration·easing을 디자인 토큰으로 정의하고, 바텀시트·모달·토스트를 비롯한 오버레이 전반에 등장/퇴장 모션을 입히면서 모달 프리미티브를 base-ui 하나로 수렴시킨다.

**Architecture:** 토큰은 `globals.css`에 CSS 변수로 두고 Tailwind `@utility`로 유틸을 노출한다. `prefers-reduced-motion`은 변수만 덮어써서 한 번에 처리하므로 모든 전환은 `transition`으로 구현하고 `@keyframes`는 쓰지 않는다. 모달 계열(`Dialog`·`BottomSheet`·`LoginGateModal`)은 base-ui가 마운트 수명·포커스 트랩·스크롤 락을 맡고, 그 외 오버레이는 `useExitTransition`·`useLastPresent` 두 훅이 맡는다.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, `@base-ui-components/react` 1.0.0-rc.0, Vitest + happy-dom + Testing Library, Storybook 10

**설계 문서:** `docs/superpowers/specs/2026-07-30-motion-tokens-design.md`

## Global Constraints

- **default export 금지** — named export만 쓴다. Next 특수 파일과 설정 파일만 예외.
- **배럴 파일 금지** — `index.ts` / `index.tsx`를 만들지도, import 하지도 않는다.
- **컴포넌트 파일은 컴포넌트 하나만 export** 한다. 내부 헬퍼는 export 하지 않는다.
- **import 경로** — 같은 route 내부는 상대경로, `_shared`/`_global`은 `@/` 절대경로.
- **파일명** — 컴포넌트 폴더/파일은 `PascalCase`, 일반 TS 파일은 `camelCase`. 역할 접미사 `.constant.ts` / `.service.ts` / `.spec.ts` 등을 지킨다.
- **객체 타입은 `type` 별칭**을 쓴다.
- **`console.log` 금지** — `console.warn` / `console.error`만 허용.
- **테스트에 `.only` / `.skip` / 주석 처리한 테스트를 커밋하지 않는다.**
- **모든 등장/퇴장은 `transition`으로 구현한다.** `@keyframes` / `animate-*`를 새로 만들지 않는다 — reduced-motion 정책이 CSS 변수 오버라이드로 동작하기 때문이다. (기존 `animate-pulse` 스켈레톤은 손대지 않는다.)
- **duration/easing 임의값 금지** — `duration-200`, `ease-[cubic-bezier(...)]` 같은 리터럴 대신 토큰 유틸만 쓴다.
- 각 태스크 끝에서 **`pnpm lint && pnpm typecheck && pnpm test`** 를 돌린다.
- 커밋 메시지는 Conventional Commits(`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `style:`)를 따른다. commitlint가 검사한다.
- 커밋 시 husky `pre-commit`이 `eslint --fix` + `prettier --write`를 돌린다. 포맷이 바뀌어 재스테이징되는 것은 정상이다.
- **safe-area는 이번 작업에서 손대지 않는다.** `env(safe-area-inset-bottom)`을 쓰는 코드는 값을 그대로 옮기기만 한다(PR #84와 충돌 방지).

**duration 토큰 값 (전 태스크 공통):** `instant` 120ms · `fast` 180ms · `normal` 240ms · `slow` 350ms

---

## Task 1: 모션 토큰과 reduced-motion 정책

**Files:**

- Create: `app/_global/_data/motion.constant.ts`
- Create: `app/_global/_tests/motionToken.spec.ts`
- Modify: `app/globals.css`

**Interfaces:**

- Consumes: 없음
- Produces:
  - `MOTION_DURATION: { readonly instant: 120; readonly fast: 180; readonly normal: 240; readonly slow: 350 }` — Task 7·8·9·10에서 import
  - Tailwind 유틸 `duration-instant` / `duration-fast` / `duration-normal` / `duration-slow` — Task 4·5·6·7·8·9·11에서 사용
  - Tailwind 유틸 `ease-enter` / `ease-exit` / `ease-standard` — 같은 태스크들에서 사용

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/_global/_tests/motionToken.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'

const globalsCss = readFileSync(
  fileURLToPath(new URL('../../globals.css', import.meta.url)),
  'utf8',
)

// 움직임 축소 블록은 값이 일부러 다르므로(1ms) 본문 파싱에서 떼어낸다.
// prettier가 CSS를 2칸 들여쓰기로 포맷하므로 바깥 닫는 중괄호만 열 0에 온다.
const REDUCED_MOTION_BLOCK = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\}/

function parseDurations(css: string): Record<string, number> {
  const durations: Record<string, number> = {}
  for (const [, name, value] of css.matchAll(/--duration-([a-z]+):\s*(\d+)ms/g)) {
    durations[name] = Number(value)
  }
  return durations
}

describe('모션 토큰', () => {
  it('globals.css의 --duration-* 가 MOTION_DURATION과 같다', () => {
    const declared = parseDurations(globalsCss.replace(REDUCED_MOTION_BLOCK, ''))

    expect(declared).toEqual({
      instant: MOTION_DURATION.instant,
      fast: MOTION_DURATION.fast,
      normal: MOTION_DURATION.normal,
      slow: MOTION_DURATION.slow,
    })
  })

  it('모든 duration 토큰에 대응하는 @utility가 있다', () => {
    for (const name of Object.keys(MOTION_DURATION)) {
      expect(globalsCss).toContain(`@utility duration-${name}`)
    }
  })

  it('움직임 축소 설정에서는 모든 duration이 1ms로 떨어진다', () => {
    const reducedBlock = REDUCED_MOTION_BLOCK.exec(globalsCss)?.[0] ?? ''

    expect(parseDurations(reducedBlock)).toEqual({
      instant: 1,
      fast: 1,
      normal: 1,
      slow: 1,
    })
  })

  it('등장·퇴장·상태 전환 easing 토큰이 선언되어 있다', () => {
    expect(globalsCss).toContain('--ease-enter:')
    expect(globalsCss).toContain('--ease-exit:')
    expect(globalsCss).toContain('--ease-standard:')
  })
})
```

- [ ] **Step 2: 실패하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/motionToken.spec.ts`
Expected: FAIL — `Failed to resolve import "@/app/_global/_data/motion.constant"`

- [ ] **Step 3: TS 상수를 만든다**

`app/_global/_data/motion.constant.ts`:

```ts
/** 모션 duration(ms).
 *
 * globals.css의 `--duration-*` 와 반드시 같은 값이어야 한다 — CSS만 고치고 여기를 잊으면
 * 퇴장 애니메이션이 끝나기 전에 언마운트되거나 그 반대가 된다. motionToken.spec.ts가 둘을 맞춰 잠근다.
 *
 * CSS만으로 끝나지 않는 이유는 useExitTransition이 언마운트 시점을 타이머로 재기 때문이다.
 * 테스트 환경(happy-dom)에서는 CSS 전환이 실제로 돌지 않아 transitionend가 오지 않는다. */
export const MOTION_DURATION = {
  /** 프레스 피드백, 색 전환 */
  instant: 120,
  /** 백드롭, 토스트, 팝오버 */
  fast: 180,
  /** 모달·바텀시트 등장 */
  normal: 240,
  /** 전체화면 전환 */
  slow: 350,
} as const
```

- [ ] **Step 4: globals.css에 토큰을 넣는다**

`app/globals.css`의 `@theme static { ... }` 블록 맨 끝(타이포그래피 `--text-caption-12rg--font-weight: 400;` 다음 줄)에 easing을 추가한다:

```css
/* Motion — easing. --ease-*는 Tailwind v4 네이티브 네임스페이스라 유틸이 자동 생성된다 */
--ease-enter: cubic-bezier(0.16, 1, 0.3, 1); /* 등장 — 빠르게 나와 부드럽게 안착 */
--ease-exit: cubic-bezier(0.4, 0, 1, 1); /* 퇴장 — 가속하며 사라짐 */
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1); /* 상태 전환 — 색·투명도·프레스 */
```

그리고 `@theme static` 블록이 닫힌 **뒤에**, `body { ... }` 규칙 **앞에** 다음을 추가한다:

```css
/* Motion — duration.
   --duration-*는 Tailwind 테마 네임스페이스가 아니라 @theme에 둬도 유틸이 생기지 않는다.
   평범한 :root에 두어야 아래 움직임 축소 오버라이드가 소스 순서로 확실히 이긴다.
   TS에서 쓰는 같은 값은 _data/motion.constant.ts에 있고 motionToken.spec.ts가 둘을 잠근다. */
:root {
  --duration-instant: 120ms;
  --duration-fast: 180ms;
  --duration-normal: 240ms;
  --duration-slow: 350ms;
}

/* 움직임 축소 설정에서는 전환을 즉시 끝낸다.
   0ms가 아니라 1ms인 이유는 base-ui가 퇴장 완료를 전환 종료로 판정하기 때문이다 — 0이면 판정이 걸리지 않는다.
   이 정책이 성립하려면 등장/퇴장을 transition으로만 구현해야 한다. @keyframes는 duration이
   애니메이션 선언에 박혀 있어 변수 하나로 무력화되지 않는다. */
@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 1ms;
    --duration-fast: 1ms;
    --duration-normal: 1ms;
    --duration-slow: 1ms;
  }
}

/* 빌트인 duration-200과 같은 형태로 컴파일된다 — --tw-duration까지 세워야
   transition 유틸이 세운 fallback을 제대로 덮는다 */
@utility duration-instant {
  --tw-duration: var(--duration-instant);
  transition-duration: var(--duration-instant);
}

@utility duration-fast {
  --tw-duration: var(--duration-fast);
  transition-duration: var(--duration-fast);
}

@utility duration-normal {
  --tw-duration: var(--duration-normal);
  transition-duration: var(--duration-normal);
}

@utility duration-slow {
  --tw-duration: var(--duration-slow);
  transition-duration: var(--duration-slow);
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/motionToken.spec.ts`
Expected: PASS (4개)

- [ ] **Step 6: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 통과. 테스트는 기존 158개 + 신규 4개 = 162개.

- [ ] **Step 7: 커밋**

```bash
git add app/globals.css app/_global/_data/motion.constant.ts app/_global/_tests/motionToken.spec.ts
git commit -m "feat: 모션 duration·easing 토큰과 움직임 축소 정책 추가"
```

---

## Task 2: useExitTransition 훅

**Files:**

- Create: `app/_global/_hooks/useExitTransition.ts`
- Create: `app/_global/_tests/useExitTransition.spec.ts`

**Interfaces:**

- Consumes: 없음
- Produces:
  - `type ExitTransitionState = 'entering' | 'open' | 'exiting'`
  - `useExitTransition(open: boolean, durationMs: number): { shouldRender: boolean; state: ExitTransitionState }` — Task 7·8·9에서 사용

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/_global/_tests/useExitTransition.spec.ts`:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'

// 가짜 타이머 대신 짧은 실제 duration을 쓴다 — requestAnimationFrame과 setTimeout이
// 섞여 있어 가짜 타이머로는 전이 순서를 맞추기 번거롭다.
const DURATION = 20

describe('useExitTransition', () => {
  it('처음부터 열려 있으면 등장 전환 없이 바로 open이다', () => {
    const { result } = renderHook(() => useExitTransition(true, DURATION))

    expect(result.current.shouldRender).toBe(true)
    expect(result.current.state).toBe('open')
  })

  it('처음부터 닫혀 있으면 렌더하지 않는다', () => {
    const { result } = renderHook(() => useExitTransition(false, DURATION))

    expect(result.current.shouldRender).toBe(false)
  })

  it('열리면 entering을 거쳐 open이 된다', async () => {
    const { result, rerender } = renderHook(({ open }) => useExitTransition(open, DURATION), {
      initialProps: { open: false },
    })

    rerender({ open: true })
    expect(result.current.shouldRender).toBe(true)

    await waitFor(() => {
      expect(result.current.state).toBe('open')
    })
  })

  it('닫혀도 duration 동안은 exiting 상태로 렌더를 유지한다', async () => {
    const { result, rerender } = renderHook(({ open }) => useExitTransition(open, DURATION), {
      initialProps: { open: true },
    })

    rerender({ open: false })
    expect(result.current.shouldRender).toBe(true)
    expect(result.current.state).toBe('exiting')

    await waitFor(() => {
      expect(result.current.shouldRender).toBe(false)
    })
  })

  it('퇴장 도중 다시 열리면 렌더를 유지한 채 open으로 돌아온다', async () => {
    const { result, rerender } = renderHook(({ open }) => useExitTransition(open, DURATION), {
      initialProps: { open: true },
    })

    rerender({ open: false })
    rerender({ open: true })

    await waitFor(() => {
      expect(result.current.state).toBe('open')
    })
    expect(result.current.shouldRender).toBe(true)
  })
})
```

- [ ] **Step 2: 실패하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/useExitTransition.spec.ts`
Expected: FAIL — `Failed to resolve import "@/app/_global/_hooks/useExitTransition"`

- [ ] **Step 3: 훅을 구현한다**

`app/_global/_hooks/useExitTransition.ts`:

```ts
'use client'

import { useEffect, useRef, useState } from 'react'

export type ExitTransitionState = 'entering' | 'open' | 'exiting'

type ExitTransition = {
  shouldRender: boolean
  state: ExitTransitionState
}

/**
 * base-ui를 쓰지 않는 오버레이의 마운트 수명을 관리한다.
 * open이 false로 바뀌어도 durationMs 동안은 shouldRender를 유지해 퇴장 전환이 보이게 한다.
 *
 * 반환한 state는 호출부에서 data-state 속성으로 넘겨 CSS로 받는다.
 * 어떤 state에 어떤 스타일을 줄지는 컴포넌트가 정한다 — 예컨대 스플래시는 entering에
 * 아무 스타일도 주지 않아 등장 없이 퇴장만 한다.
 *
 * transitionend가 아니라 타이머로 끝을 판정한다. 테스트 환경(happy-dom)에서는 CSS 전환이
 * 실제로 돌지 않아 transitionend가 오지 않기 때문이고, 그래서 duration을 인자로 받는다.
 * 값은 _data/motion.constant.ts의 MOTION_DURATION에서 가져온다.
 */
export function useExitTransition(open: boolean, durationMs: number): ExitTransition {
  const [shouldRender, setShouldRender] = useState(open)
  // 처음부터 열린 채 마운트되면 등장 전환을 건너뛴다 — 화면 진입 때 깜빡이지 않게.
  const [state, setState] = useState<ExitTransitionState>(open ? 'open' : 'exiting')
  const wasOpenRef = useRef(open)

  useEffect(() => {
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = open
    // 마운트 직후이거나 open이 그대로면 할 일이 없다.
    // StrictMode가 effect를 두 번 부를 때 등장 전환이 두 번 도는 것도 이 비교가 막는다.
    if (wasOpen === open) return

    if (open) {
      setShouldRender(true)
      // 마운트와 같은 프레임에 최종 스타일을 주면 브라우저가 전환 시작점을 잡지 못한다
      setState('entering')
      const frame = requestAnimationFrame(() => {
        setState('open')
      })
      return () => {
        cancelAnimationFrame(frame)
      }
    }

    setState('exiting')
    const timer = setTimeout(() => {
      setShouldRender(false)
    }, durationMs)
    return () => {
      clearTimeout(timer)
    }
  }, [open, durationMs])

  return { shouldRender, state }
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/useExitTransition.spec.ts`
Expected: PASS (5개)

- [ ] **Step 5: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 6: 커밋**

```bash
git add app/_global/_hooks/useExitTransition.ts app/_global/_tests/useExitTransition.spec.ts
git commit -m "feat: 퇴장 전환용 useExitTransition 훅 추가"
```

---

## Task 3: useLastPresent 훅

**Files:**

- Create: `app/_global/_hooks/useLastPresent.ts`
- Create: `app/_global/_tests/useLastPresent.spec.ts`

**Interfaces:**

- Consumes: 없음
- Produces: `useLastPresent<T>(value: T | null): T | null` — Task 6·7·8·9에서 사용

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/_global/_tests/useLastPresent.spec.ts`:

```ts
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

describe('useLastPresent', () => {
  it('값이 있으면 그대로 돌려준다', () => {
    const { result } = renderHook(() => useLastPresent('안녕'))

    expect(result.current).toBe('안녕')
  })

  it('값이 null이 되면 직전 값을 유지한다', () => {
    const { result, rerender } = renderHook(({ value }) => useLastPresent(value), {
      initialProps: { value: '저장했어요' as string | null },
    })

    rerender({ value: null })

    expect(result.current).toBe('저장했어요')
  })

  it('새 값이 오면 새 값으로 갱신된다', () => {
    const { result, rerender } = renderHook(({ value }) => useLastPresent(value), {
      initialProps: { value: '첫 번째' as string | null },
    })

    rerender({ value: null })
    rerender({ value: '두 번째' })

    expect(result.current).toBe('두 번째')
  })

  it('처음부터 null이면 null을 돌려준다', () => {
    const { result } = renderHook(() => useLastPresent<string>(null))

    expect(result.current).toBeNull()
  })

  it('객체도 참조 그대로 유지한다', () => {
    const trace = { opinionId: 1 }
    const { result, rerender } = renderHook(({ value }) => useLastPresent(value), {
      initialProps: { value: trace as { opinionId: number } | null },
    })

    rerender({ value: null })

    expect(result.current).toBe(trace)
  })
})
```

- [ ] **Step 2: 실패하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/useLastPresent.spec.ts`
Expected: FAIL — `Failed to resolve import "@/app/_global/_hooks/useLastPresent"`

- [ ] **Step 3: 훅을 구현한다**

`app/_global/_hooks/useLastPresent.ts`:

```ts
'use client'

import { useState } from 'react'

/**
 * 퇴장 애니메이션이 도는 동안 마지막으로 존재했던 값을 유지한다.
 * 값이 사라지는 순간 화면의 내용까지 같이 비면 퇴장 전환이 빈 상자로 보인다.
 *
 * 빈 문자열처럼 '없음'을 뜻하는 falsy 값은 호출부에서 null로 정규화해서 넘긴다
 * (예: useLastPresent(message || null)). 이 훅은 null만 '없음'으로 본다.
 */
export function useLastPresent<T>(value: T | null): T | null {
  const [lastPresent, setLastPresent] = useState<T | null>(value)

  // 렌더 도중의 setState — React가 권하는 "이전 렌더 정보로 상태 조정하기" 패턴이다.
  // effect로 미루면 값이 사라진 프레임이 한 번 그려진다.
  if (value !== null && value !== lastPresent) {
    setLastPresent(value)
  }

  return value ?? lastPresent
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/useLastPresent.spec.ts`
Expected: PASS (5개)

- [ ] **Step 5: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 6: 커밋**

```bash
git add app/_global/_hooks/useLastPresent.ts app/_global/_tests/useLastPresent.spec.ts
git commit -m "feat: 퇴장 중 마지막 값을 유지하는 useLastPresent 훅 추가"
```

---

## Task 4: Dialog에 모션 토큰 적용

**Files:**

- Modify: `app/_global/_components/Dialog/Dialog.tsx:39-51` (Backdrop), `app/_global/_components/Dialog/Dialog.tsx:64-78` (Popup)

**Interfaces:**

- Consumes: Task 1의 `duration-fast` / `duration-normal` / `ease-enter` / `ease-exit` 유틸
- Produces: 없음 (`Dialog` public API 불변)

**이 태스크에 새 유닛 테스트를 추가하지 않는다.** 바꾸는 것이 Tailwind 클래스 문자열뿐이고, 클래스 문자열을 assert 하는 테스트는 리팩터링마다 깨지면서 아무 버그도 못 잡는다. 회귀는 기존 `Dialog.spec.tsx`(열림·닫힘 동작)가 받치고, "임의값을 안 쓴다"는 규칙은 Task 12의 컨벤션 가드가 저장소 전체에 대해 강제한다. 모션 자체는 Storybook에서 눈으로 확인한다.

- [ ] **Step 1: Backdrop의 하드코딩된 duration을 토큰으로 바꾼다**

`Dialog.tsx`의 `Backdrop`에서 이 부분을

```tsx
'fixed inset-0 z-50 bg-bg-black/50 transition-opacity duration-200',
'data-starting-style:opacity-0 data-ending-style:opacity-0',
```

이렇게 바꾼다:

```tsx
'fixed inset-0 z-50 bg-bg-black/50 transition-opacity duration-fast ease-enter',
'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:ease-exit',
```

- [ ] **Step 2: Popup의 하드코딩된 duration을 토큰으로 바꾼다**

`Dialog.tsx`의 `Popup`에서 이 부분을

```tsx
'transition-[opacity,transform] duration-200',
'data-starting-style:scale-95 data-starting-style:opacity-0',
'data-ending-style:scale-95 data-ending-style:opacity-0',
```

이렇게 바꾼다:

```tsx
// 등장은 넉넉하게, 퇴장은 짧게 — 사라지는 걸 기다리게 하지 않는다
'transition-[opacity,transform] duration-normal ease-enter',
'data-starting-style:scale-95 data-starting-style:opacity-0',
'data-ending-style:scale-95 data-ending-style:opacity-0',
'data-ending-style:duration-fast data-ending-style:ease-exit',
```

- [ ] **Step 3: 회귀 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run app/_global/_components/Dialog/Dialog.spec.tsx`
Expected: PASS (2개)

- [ ] **Step 4: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 5: 커밋**

```bash
git add app/_global/_components/Dialog/Dialog.tsx
git commit -m "refactor: Dialog의 하드코딩된 전환 값을 모션 토큰으로 교체"
```

---

## Task 5: BottomSheet를 base-ui로 포팅하고 슬라이드 모션 적용

**Files:**

- Modify: `app/_global/_components/BottomSheet/BottomSheet.tsx` (전면 재작성)
- Modify: `app/_global/_components/BottomSheet/BottomSheet.stories.tsx`
- Modify: `app/_global/_tests/bottomSheet.spec.tsx` (케이스 1개 추가)

**Interfaces:**

- Consumes: Task 1의 duration·easing 유틸
- Produces: `BottomSheet({ open, title, onClose, children })` — props는 지금과 **완전히 동일**하다. 사용처(`TraceSourceSheet`, `ManualQuoteSheet`)는 고치지 않는다.

**왜 우리 `Dialog` 네임스페이스가 아니라 base-ui를 직접 import 하나:** 우리 `Dialog.Popup`은 앱 다이얼로그 카드 모양(`rounded-[32px]`, `max-w-[343px]`, 일러스트 자리 `pt-[46px]`)이 박혀 있어서 시트로 쓰려면 override 범벅이 된다. 둘은 같은 base-ui 프리미티브를 쓰되 표현이 다른 형제다.

- [ ] **Step 1: 배경 탭으로 닫히는 테스트를 추가한다**

`app/_global/_tests/bottomSheet.spec.tsx`의 `describe` 안 맨 끝에 추가한다:

```tsx
it('배경을 누르면 onClose를 호출한다', async () => {
  const onClose = vi.fn()
  render(
    <BottomSheet open title="제목" onClose={onClose}>
      <p>본문</p>
    </BottomSheet>,
  )

  const backdrop = document.querySelector('[data-slot="bottom-sheet-backdrop"]')
  expect(backdrop).not.toBeNull()
  await userEvent.click(backdrop as Element)

  expect(onClose).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: 실패하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/bottomSheet.spec.tsx`
Expected: 새 케이스만 FAIL — `expect(backdrop).not.toBeNull()`에서 실패한다(지금은 `data-slot`이 없는 `<button aria-label="배경 닫기">`다). 기존 4개는 PASS.

- [ ] **Step 3: BottomSheet를 base-ui 위에 다시 쓴다**

`app/_global/_components/BottomSheet/BottomSheet.tsx` 전체를 교체한다:

```tsx
'use client'

import { Dialog as BaseDialog } from '@base-ui-components/react/dialog'
import type { ReactNode } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

import CloseIcon from '../Icon/assets/close.svg'

type BottomSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

// Dialog와 같은 base-ui 프리미티브 위에 올린다 — 포커스 트랩·스크롤 락·Esc·바깥 탭 닫힘을
// 직접 만들지 않기 위함이다. 바깥에 노출하는 props는 손수 구현하던 시절과 같게 유지한다.
// 포털로 body 끝에 렌더되므로 z는 Dialog와 같은 z-50으로 맞춘다.
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop
          data-slot="bottom-sheet-backdrop"
          className={cn(
            'fixed inset-0 z-50 bg-bg-black/50 transition-opacity duration-fast ease-enter',
            'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:ease-exit',
          )}
        />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex flex-col justify-end">
          <BaseDialog.Popup
            data-slot="bottom-sheet-popup"
            className={cn(
              'relative flex flex-col rounded-t-[32px] bg-bg-default pt-6 pb-4',
              'transition-transform duration-normal ease-enter',
              'data-starting-style:translate-y-full data-ending-style:translate-y-full',
              'data-ending-style:duration-fast data-ending-style:ease-exit',
            )}
            // 홈 인디케이터에 시트 내용이 가리지 않게 한다
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5">
              <BaseDialog.Title className="min-w-px flex-1 text-title-18bd text-text-secondary">
                {title}
              </BaseDialog.Title>
              <BaseDialog.Close
                aria-label="닫기"
                className="flex size-6 shrink-0 cursor-pointer items-center justify-center text-icon-primary"
              >
                <CloseIcon aria-hidden="true" className="size-6 text-icon-primary" />
              </BaseDialog.Close>
            </div>
            {/* 시안의 시트는 본문이 자기 여백을 가진다 — 패널은 가로 여백을 두지 않는다 */}
            <div className="flex flex-col gap-4 p-4">{children}</div>
          </BaseDialog.Popup>
        </BaseDialog.Viewport>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  )
}
```

바뀐 점: Esc를 직접 듣던 `useEffect`가 사라졌고(base-ui가 처리), `aria-label={title}` 대신 `BaseDialog.Title`이 접근성 이름을 잇는다.

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/bottomSheet.spec.tsx`
Expected: PASS (5개)

**배경 탭 테스트가 실패하면:** base-ui의 outside-press가 happy-dom에서 걸리지 않는 경우다. `userEvent.pointer`로 pointerdown → pointerup을 명시적으로 보내는 방법을 한 번 시도해 보고, 그래도 안 되면 그 케이스만 지우고 **커밋 메시지 본문에 "배경 탭 닫힘은 happy-dom에서 재현되지 않아 Storybook에서 수동 확인" 이라고 남긴다.** 조용히 지우지 말 것. 나머지 4개는 반드시 통과해야 한다.

- [ ] **Step 5: Storybook 스토리를 고친다**

포털이 body로 나가므로 기존 `relative h-[600px] w-[375px] overflow-hidden` 데코레이터는 더 이상 시트를 담지 못한다. `BottomSheet.stories.tsx` 전체를 교체한다:

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'

// base-ui 포털로 body 끝에 렌더되므로 프레임 데코레이터로 가둘 수 없다 — 캔버스 전체를 쓴다
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
} satisfies Meta<typeof BottomSheet>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Closed: Story = {
  args: { open: false },
}

// 등장·퇴장 전환은 정지 화면으로는 볼 수 없다
export const Toggle: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false)
    return (
      <div className="p-4">
        <button
          type="button"
          className="rounded-2xl bg-interactive-btn-primary px-4 py-3 text-text-inverse"
          onClick={() => {
            setOpen(true)
          }}
        >
          시트 열기
        </button>
        <BottomSheet
          {...args}
          open={open}
          onClose={() => {
            setOpen(false)
          }}
        />
      </div>
    )
  },
}
```

- [ ] **Step 6: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 7: 커밋**

```bash
git add app/_global/_components/BottomSheet/BottomSheet.tsx app/_global/_components/BottomSheet/BottomSheet.stories.tsx app/_global/_tests/bottomSheet.spec.tsx
git commit -m "refactor: BottomSheet를 base-ui 위에 올리고 슬라이드 전환 적용"
```

---

## Task 6: LoginGateModal을 Dialog로 흡수

**Files:**

- Modify: `app/_global/_components/LoginGateModal/LoginGateModal.tsx` (전면 재작성)
- Modify: `app/_global/_providers/LoginGateProvider/LoginGateProvider.tsx:20-27`
- Create: `app/_global/_tests/loginGateModal.spec.tsx`

**Interfaces:**

- Consumes: `Dialog` (`app/_global/_components/Dialog/Dialog`), Task 3의 `useLastPresent`
- Produces: `LoginGateModal({ message: string | null, onLogin: () => void, onClose: () => void })` — `message`가 `string`에서 **`string | null`로 바뀐다**. `null`이 닫힌 상태다.

**⚠️ 디자인 확인이 필요한 시각 변화:** 지금 게이트 모달은 `max-w-78` / `rounded-[12px]` / `p-6` 카드다. `Dialog.Popup`으로 옮기면 `max-w-[343px]` / `rounded-[32px]`로 앱 표준 다이얼로그 모양이 된다. 통일이 목적이므로 의도된 변화지만, 리뷰에서 짚을 수 있으니 **PR 설명에 스크린샷과 함께 적을 것.**

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/_global/_tests/loginGateModal.spec.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoginGateModal } from '@/app/_global/_components/LoginGateModal/LoginGateModal'

describe('LoginGateModal', () => {
  it('message가 null이면 열리지 않는다', () => {
    render(<LoginGateModal message={null} onLogin={vi.fn()} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('message를 주면 안내 문구와 함께 열린다', async () => {
    render(
      <LoginGateModal
        message="로그인하면 흔적을 남길 수 있어요"
        onLogin={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAccessibleName('로그인하면 흔적을 남길 수 있어요')
  })

  it('로그인 버튼을 누르면 onLogin을 호출한다', async () => {
    const onLogin = vi.fn()
    render(<LoginGateModal message="로그인이 필요해요" onLogin={onLogin} onClose={vi.fn()} />)
    await screen.findByRole('dialog')

    await userEvent.click(screen.getByRole('button', { name: '로그인 하러가기' }))

    expect(onLogin).toHaveBeenCalledOnce()
  })

  it('닫기 버튼을 누르면 onClose를 호출한다', async () => {
    const onClose = vi.fn()
    render(<LoginGateModal message="로그인이 필요해요" onLogin={vi.fn()} onClose={onClose} />)
    await screen.findByRole('dialog')

    await userEvent.click(screen.getByRole('button', { name: '닫기' }))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce()
    })
  })
})
```

- [ ] **Step 2: 실패하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/loginGateModal.spec.tsx`
Expected: FAIL — 지금 컴포넌트는 `message`가 `string`이고 `role="dialog"`를 항상 렌더하므로 첫 케이스부터 실패한다.

- [ ] **Step 3: LoginGateModal을 다시 쓴다**

`app/_global/_components/LoginGateModal/LoginGateModal.tsx` 전체를 교체한다:

```tsx
'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'

type LoginGateModalProps = {
  /** 막힌 액션에 맞는 안내 문구. null이면 닫힌 상태다 — 문구 선택은 게이트를 호출한 쪽이 정한다 */
  message: string | null
  onLogin: () => void
  onClose: () => void
}

export function LoginGateModal({ message, onLogin, onClose }: LoginGateModalProps) {
  // 닫히는 동안 문구가 먼저 사라지면 퇴장 전환이 빈 카드로 보인다
  const shownMessage = useLastPresent(message)

  return (
    <Dialog.Root
      open={message !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      {/* 게이트는 일러스트가 없다 — Dialog.Content의 일러스트 자리 여백(pt-[46px])을 되돌린다 */}
      <Dialog.Content className="gap-4 pt-6">
        <Dialog.Header>
          <Dialog.Title className="text-title-16sb font-semibold leading-normal">
            {shownMessage}
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Footer className="flex-col">
          <Button
            variant="activated"
            className="rounded-full py-3 text-body-14sb"
            onClick={onLogin}
          >
            로그인 하러가기
          </Button>
          <Dialog.Close className="cursor-pointer text-body-14rg text-text-secondary opacity-50">
            닫기
          </Dialog.Close>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

- [ ] **Step 4: Provider가 조건부 렌더를 그만두게 한다**

`app/_global/_providers/LoginGateProvider/LoginGateProvider.tsx`에서

```tsx
{
  gate.gateMessage !== null && (
    <LoginGateModal message={gate.gateMessage} onLogin={gate.login} onClose={gate.close} />
  )
}
```

를 이렇게 바꾼다:

```tsx
{
  /* 퇴장 전환을 보여주려면 닫힌 동안에도 마운트돼 있어야 한다 — 열림은 message가 표현한다 */
}
;<LoginGateModal message={gate.gateMessage} onLogin={gate.login} onClose={gate.close} />
```

실제 JSX는 다음 형태가 된다:

```tsx
return (
  <LoginGateContext.Provider value={gate.runWithLogin}>
    {children}
    {/* 퇴장 전환을 보여주려면 닫힌 동안에도 마운트돼 있어야 한다 — 열림은 message가 표현한다 */}
    <LoginGateModal message={gate.gateMessage} onLogin={gate.login} onClose={gate.close} />
  </LoginGateContext.Provider>
)
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/loginGateModal.spec.tsx`
Expected: PASS (4개)

- [ ] **Step 6: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 통과. `useLoginGateState`나 `authProvider.spec`이 깨지면 `message` 타입 변경을 못 따라간 곳이 있는 것이니 그쪽을 고친다.

- [ ] **Step 7: 커밋**

```bash
git add app/_global/_components/LoginGateModal/LoginGateModal.tsx app/_global/_providers/LoginGateProvider/LoginGateProvider.tsx app/_global/_tests/loginGateModal.spec.tsx
git commit -m "refactor: 로그인 게이트 모달을 공용 Dialog로 흡수"
```

---

## Task 7: Snackbar 등장/퇴장 전환

**Files:**

- Modify: `app/_global/_components/Snackbar/Snackbar.tsx`
- Modify: `app/_global/_tests/snackbar.spec.tsx` (케이스 1개 추가)
- Modify: `app/_global/_components/Snackbar/Snackbar.stories.tsx` (토글 스토리 추가)

**Interfaces:**

- Consumes: Task 1의 `MOTION_DURATION`·duration·easing 유틸, Task 2의 `useExitTransition`, Task 3의 `useLastPresent`
- Produces: `Snackbar({ message: string, onClose: () => void })` — props 불변. 사용처 3곳(`TraceOpinionForm`·`OcrSelector`·`TraceDecorateForm`)은 고치지 않는다.

- [ ] **Step 1: 퇴장 전환 테스트를 추가한다**

`app/_global/_tests/snackbar.spec.tsx`의 `describe` 안 맨 끝에 추가한다:

```tsx
it('message가 비면 곧바로 사라지지 않고 문구를 유지한 채 퇴장한다', () => {
  const { rerender } = render(<Snackbar message="저장했어요" onClose={vi.fn()} />)

  rerender(<Snackbar message="" onClose={vi.fn()} />)

  // 퇴장 전환이 도는 동안에는 아직 붙어 있고, 문구도 비지 않는다
  expect(screen.getByRole('status')).toHaveTextContent('저장했어요')

  act(() => {
    vi.advanceTimersByTime(MOTION_DURATION.fast)
  })

  expect(screen.queryByRole('status')).toBeNull()
})
```

같은 파일 import에 다음을 추가한다:

```tsx
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
```

- [ ] **Step 2: 실패하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/snackbar.spec.tsx`
Expected: 새 케이스만 FAIL — 지금은 `message=''`이면 즉시 `null`을 반환해 `getByRole('status')`가 못 찾는다. 기존 4개는 PASS.

- [ ] **Step 3: Snackbar를 고친다**

`app/_global/_components/Snackbar/Snackbar.tsx` 전체를 교체한다:

```tsx
'use client'

import { useEffect, useRef } from 'react'

import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
import { cn } from '@/app/_global/_services/cn.service'

import CloseIcon from '../Icon/assets/close.svg'

type SnackbarProps = {
  message: string
  onClose: () => void
}

const AUTO_DISMISS_MS = 3000

export function Snackbar({ message, onClose }: SnackbarProps) {
  const onCloseRef = useRef(onClose)

  // 매 렌더마다 ref 갱신 (exhaustive-deps 규칙 만족)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // 타이머는 message에만 의존 (부모 리렌더 시 리셋 안 됨)
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => {
      onCloseRef.current()
    }, AUTO_DISMISS_MS)
    return () => {
      clearTimeout(timer)
    }
  }, [message])

  const { shouldRender, state } = useExitTransition(Boolean(message), MOTION_DURATION.fast)
  // 빈 문자열이 '닫힘'을 뜻하므로 null로 정규화해서 넘긴다 — 퇴장 중 문구가 비지 않게 한다
  const shownMessage = useLastPresent(message || null)

  if (!shouldRender || shownMessage === null) return null

  return (
    <div
      role="status"
      data-state={state}
      className={cn(
        'absolute inset-x-4 bottom-24 z-30 flex items-center justify-between gap-4 rounded-lg bg-bg-default px-4 py-3',
        'transition-[opacity,translate] duration-fast ease-enter',
        'data-[state=entering]:translate-y-2 data-[state=entering]:opacity-0',
        'data-[state=exiting]:translate-y-2 data-[state=exiting]:opacity-0 data-[state=exiting]:ease-exit',
      )}
    >
      <span className="text-body-14md text-text-accent">{shownMessage}</span>
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

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/snackbar.spec.tsx`
Expected: PASS (5개)

- [ ] **Step 5: 토글 스토리를 추가한다**

`app/_global/_components/Snackbar/Snackbar.stories.tsx` 맨 끝에 추가하고, 파일 상단 import에 `import { useState } from 'react'`를 더한다:

```tsx
// 등장·퇴장 전환은 정지 화면으로는 볼 수 없다
export const Toggle: Story = {
  render: (args) => {
    const [message, setMessage] = useState('')
    return (
      <>
        <button
          type="button"
          className="m-4 rounded-2xl bg-interactive-btn-primary px-4 py-3 text-text-inverse"
          onClick={() => {
            setMessage(message ? '' : args.message)
          }}
        >
          토스트 토글
        </button>
        <Snackbar
          message={message}
          onClose={() => {
            setMessage('')
          }}
        />
      </>
    )
  },
}
```

- [ ] **Step 6: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 7: 커밋**

```bash
git add app/_global/_components/Snackbar/Snackbar.tsx app/_global/_components/Snackbar/Snackbar.stories.tsx app/_global/_tests/snackbar.spec.tsx
git commit -m "feat: 토스트에 등장·퇴장 전환 적용"
```

---

## Task 8: TraceDetailOverlay 슬라이드 전환

**Files:**

- Modify: `app/trace/[id]/_components/TraceDetailOverlay/TraceDetailOverlay.tsx` (props에 `state` 추가, 루트 className)
- Modify: `app/trace/[id]/_components/TraceCollapseView/TraceCollapseView.tsx:77` 부근과 `:183-201`

**Interfaces:**

- Consumes: Task 1의 `MOTION_DURATION`·유틸, Task 2의 `useExitTransition`, Task 3의 `useLastPresent`, Task 2의 `ExitTransitionState` 타입
- Produces: `TraceDetailOverlayProps`에 **선택적** `state?: ExitTransitionState` 추가. 기존 테스트(`traceComments.spec.tsx`)는 이 prop을 안 넘기므로 그대로 통과한다.

- [ ] **Step 1: 오버레이가 전환 상태를 받도록 고친다**

`TraceDetailOverlay.tsx` 상단 import에 추가:

```tsx
import type { ExitTransitionState } from '@/app/_global/_hooks/useExitTransition'
import { cn } from '@/app/_global/_services/cn.service'
```

`TraceDetailOverlayProps` 타입에 필드를 추가한다:

```tsx
type TraceDetailOverlayProps = {
  trace: Trace
  index: number
  count: number
  quote: string
  /** 전환 상태. 넘기지 않으면 애니메이션 없이 그대로 보인다 */
  state?: ExitTransitionState
  onNavigate: (index: number) => void
  onClose: () => void
}
```

구조 분해에 `state`를 더하고, 루트 `div`를 이렇게 바꾼다:

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-label="의견 상세"
  data-state={state}
  className={cn(
    'fixed inset-0 z-20 mx-auto flex h-dvh w-full max-w-[530px] flex-col bg-bg-dark',
    // 목록 위로 올라와 덮는 모달 프레젠테이션 — 좌우는 이전/다음 의견 이동이라 세로로 움직인다
    'transition-transform duration-slow ease-enter',
    'data-[state=entering]:translate-y-full',
    'data-[state=exiting]:translate-y-full data-[state=exiting]:ease-exit',
  )}
>
```

- [ ] **Step 2: 호출부에서 전환 수명을 관리한다**

`TraceCollapseView.tsx` 상단 import에 추가:

```tsx
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
```

77행의 `selectedTrace` 아래에 두 줄을 더한다:

```tsx
const selectedTrace = traces.find((trace) => trace.opinionId === selectedTraceId)
// 닫히는 동안에도 내용이 남아 있어야 슬라이드 아웃이 빈 화면으로 보이지 않는다
const shownTrace = useLastPresent(selectedTrace ?? null)
const detail = useExitTransition(selectedTrace !== undefined, MOTION_DURATION.slow)
```

183행의 렌더 조건과 props를 바꾼다:

```tsx
{
  detail.shouldRender && shownTrace && (
    <TraceDetailOverlay
      trace={shownTrace}
      state={detail.state}
      index={traces.indexOf(shownTrace)}
      count={traces.length}
      quote={highlight.quotes[viewer.quoteIndex] ?? ''}
      onNavigate={(next) => {
        const target = traces[next]
        if (target) setSelectedTraceId(target.opinionId)
        // 상세에서도 마지막 흔적에 닿으면 다음 페이지를 이어 붙인다
        if (next >= traces.length - 1 && canFetchMoreTraces) {
          void opinionsQuery.fetchNextPage()
        }
      }}
      onClose={() => {
        setSelectedTraceId(null)
      }}
    />
  )
}
```

- [ ] **Step 3: 회귀 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run "app/trace/[id]/_tests"`
Expected: PASS — `traceComments.spec.tsx`는 `TraceDetailOverlay`를 직접 렌더하고 `state`를 안 넘기므로 `data-state`가 붙지 않아 전환 클래스가 걸리지 않는다.

- [ ] **Step 4: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 5: 커밋**

```bash
git add "app/trace/[id]/_components/TraceDetailOverlay/TraceDetailOverlay.tsx" "app/trace/[id]/_components/TraceCollapseView/TraceCollapseView.tsx"
git commit -m "feat: 의견 상세 오버레이에 슬라이드 전환 적용"
```

---

## Task 9: 팝오버와 스플래시 전환

**Files:**

- Modify: `app/trace/new/_components/DecorationEditPopover/DecorationEditPopover.tsx`
- Modify: `app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx:123-124` 부근
- Modify: `app/_global/_providers/SplashProvider/SplashProvider.tsx`

**Interfaces:**

- Consumes: Task 1의 `MOTION_DURATION`·유틸, Task 2의 `useExitTransition`·`ExitTransitionState`, Task 3의 `useLastPresent`
- Produces: `DecorationEditPopoverProps`에 선택적 `state?: ExitTransitionState` 추가

- [ ] **Step 1: 팝오버가 전환 상태를 받도록 고친다**

`DecorationEditPopover.tsx` 상단 import에 `ExitTransitionState` 타입을 더하고(`cn`은 이미 import 되어 있다):

```tsx
import type { ExitTransitionState } from '@/app/_global/_hooks/useExitTransition'
```

props 타입에 필드를 더한다:

```tsx
type DecorationEditPopoverProps = {
  color: string
  /** 노트 컨테이너 기준 좌표. 꼬리 끝이 이 지점을 가리킨다. */
  left: number
  onClose: () => void
  onRecolor: (color: string) => void
  onRemove: () => void
  /** 전환 상태. 넘기지 않으면 애니메이션 없이 그대로 보인다 */
  state?: ExitTransitionState
  top: number
}
```

구조 분해에 `state`를 더하고 루트 `div`를 이렇게 바꾼다:

```tsx
<div
  ref={rootRef}
  role="dialog"
  aria-label="효과 편집"
  data-state={state}
  className={cn(
    'absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center',
    // 꼬리 끝(아래 가운데)이 제자리에 붙어 있도록 origin을 바닥으로 잡는다
    'origin-bottom transition-[opacity,scale] duration-fast ease-enter',
    'data-[state=entering]:scale-96 data-[state=entering]:opacity-0',
    'data-[state=exiting]:scale-96 data-[state=exiting]:opacity-0 data-[state=exiting]:ease-exit',
  )}
  style={{ left, top }}
>
```

- [ ] **Step 2: 호출부에서 전환 수명을 관리한다**

`TraceDecorateForm.tsx` 상단 import에 추가:

```tsx
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { useLastPresent } from '@/app/_global/_hooks/useLastPresent'
```

`editing` 상태를 선언한 곳 바로 아래에 두 줄을 더한다(`editing`이라는 이름의 `useState` 선언을 찾아 그 다음 줄에):

```tsx
// 닫히는 동안 좌표·색이 남아 있어야 팝오버가 제자리에서 줄어들며 사라진다
const shownEditing = useLastPresent(editing)
const popover = useExitTransition(editing !== null, MOTION_DURATION.fast)
```

123행 부근의 렌더를 바꾼다:

```tsx
{
  popover.shouldRender && shownEditing && (
    <DecorationEditPopover
      color={shownEditing.decoration.color}
      left={shownEditing.left}
      top={shownEditing.top}
      state={popover.state}
      onClose={() => {
        setEditing(null)
      }}
      onRecolor={(color) => {
        dispatch({
          type: 'recolorDecoration',
          startOffset: shownEditing.decoration.startOffset,
          color,
        })
        setEditing({ ...shownEditing, decoration: { ...shownEditing.decoration, color } })
      }}
      onRemove={() => {
        dispatch({ type: 'removeDecoration', startOffset: shownEditing.decoration.startOffset })
        setEditing(null)
      }}
    />
  )
}
```

**주의:** 콜백 본문에서 `editing`을 참조하던 곳을 전부 `shownEditing`으로 바꿨다. `editing`은 닫히는 순간 `null`이 되므로 그대로 두면 타입이 맞지 않는다. 반대로 상태를 **쓰는** 쪽(`setEditing`)은 그대로 `setEditing`이다.

- [ ] **Step 3: 스플래시를 페이드아웃시킨다**

`SplashProvider.tsx`에서 import에 추가:

```tsx
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
```

`shouldShowSplash` 아래에 한 줄을 더하고:

```tsx
const shouldShowSplash = status === 'loading' || !hasMinTimeElapsed
// 스플래시는 첫 프레임부터 떠 있어야 하므로 entering에는 스타일을 주지 않는다 — 퇴장만 전환한다
const splash = useExitTransition(shouldShowSplash, MOTION_DURATION.normal)
```

렌더 조건과 className을 바꾼다:

```tsx
{splash.shouldRender && (
  <div
    aria-hidden="true"
    data-state={splash.state}
    className={cn(
      'absolute inset-0 z-50 flex items-center justify-center overflow-hidden',
      'transition-opacity duration-normal ease-exit',
      'data-[state=exiting]:opacity-0',
      GRID_BACKGROUND_CLASS_NAME,
    )}
  >
```

(나머지 내부 마크업은 그대로 둔다.)

- [ ] **Step 4: 회귀 테스트가 통과하는지 확인한다**

Run: `pnpm test`
Expected: PASS (기존 전부)

- [ ] **Step 5: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 6: 커밋**

```bash
git add app/trace/new/_components/DecorationEditPopover/DecorationEditPopover.tsx app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx app/_global/_providers/SplashProvider/SplashProvider.tsx
git commit -m "feat: 효과 편집 팝오버와 스플래시에 전환 적용"
```

---

## Task 10: 흔적 접힘 애니메이션 상수를 토큰으로 연결

**Files:**

- Modify: `app/trace/[id]/_services/quoteCollapse.service.ts:59-60`

**Interfaces:**

- Consumes: Task 1의 `MOTION_DURATION`
- Produces: `COLLAPSE_ANIMATION_MS` 이름과 값(350) 모두 그대로. 사용처(`useQuoteCollapse`)는 고치지 않는다.

**시각적 변화는 없다.** 값이 이미 350ms이고 `--duration-slow`가 그 값을 흡수했으므로, 여기서는 숫자 리터럴을 토큰 참조로 바꾸기만 한다. 앞으로 `slow`를 조정하면 이 화면도 함께 따라온다.

- [ ] **Step 1: 상수를 토큰에 연결한다**

`quoteCollapse.service.ts` 상단 import에 추가:

```ts
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
```

그리고

```ts
/** 접힘 전환 애니메이션 길이(ms) — 포스트잇 접히는 손맛과 목록 대기 시간 사이 절충 */
export const COLLAPSE_ANIMATION_MS = 350
```

를 이렇게 바꾼다:

```ts
/** 접힘 전환 애니메이션 길이(ms) — 포스트잇 접히는 손맛과 목록 대기 시간 사이 절충.
    이 화면에서 고른 350ms가 디자인 시스템의 slow 토큰이 됐다(globals.css의 --duration-slow). */
export const COLLAPSE_ANIMATION_MS = MOTION_DURATION.slow
```

- [ ] **Step 2: 회귀 테스트가 통과하는지 확인한다**

Run: `pnpm vitest run "app/trace/[id]"`
Expected: PASS

- [ ] **Step 3: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 4: 커밋**

```bash
git add "app/trace/[id]/_services/quoteCollapse.service.ts"
git commit -m "refactor: 흔적 접힘 길이를 slow 모션 토큰에 연결"
```

---

## Task 11: 프레스 피드백 표준화와 상태 전환 값 명시

**Files:**

- Modify: `app/globals.css` (`@utility press` 추가)
- Modify: `app/_global/_components/Button/Button.tsx`
- Modify: `app/_global/_components/TabBar/TabBar.tsx`
- Modify: `app/_global/_components/SegmentedControl/SegmentedControl.tsx`
- Modify: `app/_global/_components/SearchTextfield/SearchTextfield.tsx:47`
- Modify: `app/_global/_components/Textarea/Textarea.tsx:30`
- Modify: `app/trace/new/_components/TraceSourceSheet/TraceSourceSheet.tsx`
- Modify: `app/camera-check/_components/CameraCheck/CameraCheck.tsx:29`

**`BookItem`은 대상에서 뺐다.** 루트가 `<article>`이라 탭 가능한 요소가 아니고, `:active`는 그 안 어디를 눌러도 걸려 카드 전체가 눌리는 것처럼 보인다. 목록 항목을 눌러 이동하는 UI가 생기면 그때 감싸는 버튼/링크에 붙인다.

**Interfaces:**

- Consumes: Task 1의 duration·easing 토큰
- Produces: Tailwind 유틸 `press` — 누를 때 살짝 눌리는 표준 피드백

- [ ] **Step 1: press 유틸을 정의한다**

`app/globals.css`의 `@utility duration-slow { ... }` 아래에 추가한다:

```css
/* 누를 때 살짝 눌리는 표준 피드백. 탭 가능한 요소에 붙인다.
   지금까지는 CameraCheck만 임시로 active:scale-95를 쓰고 나머지는 무반응이었다. */
@utility press {
  transition-property: transform, scale, opacity;
  --tw-duration: var(--duration-instant);
  transition-duration: var(--duration-instant);
  --tw-ease: var(--ease-standard);
  transition-timing-function: var(--ease-standard);

  &:active {
    scale: 0.97;
  }
}
```

- [ ] **Step 2: 공용 컴포넌트에 붙인다**

`Button.tsx` — `cn(...)` 첫 인자 문자열 끝에 `press`를 더한다:

```tsx
'flex items-center justify-center rounded-2xl p-4 text-center text-body-16bd text-text-inverse press disabled:bg-interactive-btn-disabled',
```

`TabBar.tsx` — `TabLink`의 `cn(...)` 첫 인자와 `TRACE_BUTTON_CLASS` 상수 양쪽에 `press`를 더한다:

```tsx
const TRACE_BUTTON_CLASS =
  'press flex shrink-0 items-center justify-center gap-2 rounded-full bg-interactive-accent px-4 py-3 text-body-16md text-text-primary'
```

```tsx
className={cn(
  'press flex w-12 shrink-0 flex-col items-center gap-0.5 text-caption-12rg uppercase text-text-inverse',
  !isActive && 'opacity-60',
)}
```

`SegmentedControl.tsx` — 옵션 버튼의 `transition-colors`에 duration·easing을 명시하고 `press`를 더한다:

```tsx
className={cn(
  'press flex-1 rounded-full py-3 text-center transition-colors duration-instant ease-standard',
  isSelected ? 'bg-bg-default text-text-primary' : 'text-text-inverse opacity-50',
)}
```

`TraceSourceSheet.tsx` — `SourceOption`의 버튼 className 맨 앞에 `press`를 더한다:

```tsx
className =
  'press flex h-[156px] min-w-px flex-1 cursor-pointer flex-col items-end justify-between overflow-hidden bg-bg-surface p-5 text-left'
```

- [ ] **Step 3: 남은 상태 전환에 duration·easing을 명시한다**

`SearchTextfield.tsx:47` — `transition-opacity` 를 `transition-opacity duration-instant ease-standard` 로 바꾼다.

`Textarea.tsx:30` — `transition-colors` 를 `transition-colors duration-instant ease-standard` 로 바꾼다.

`CameraCheck.tsx:29` — 임시 구현을 표준 유틸로 교체한다. `transition active:scale-95` 를 `press` 로 바꾼다:

```tsx
className =
  'press rounded-full bg-foreground px-10 py-4 text-lg font-semibold text-background shadow-lg'
```

- [ ] **Step 4: 회귀 테스트가 통과하는지 확인한다**

Run: `pnpm test`
Expected: PASS (기존 전부). `segmentedControl.spec.tsx`와 `cameraCheck.spec.tsx`가 동작 기준으로 짜여 있어 클래스 변경에 영향받지 않는다.

- [ ] **Step 5: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`

- [ ] **Step 6: 커밋**

```bash
git add app/globals.css app/_global/_components/Button/Button.tsx app/_global/_components/TabBar/TabBar.tsx app/_global/_components/SegmentedControl/SegmentedControl.tsx app/_global/_components/SearchTextfield/SearchTextfield.tsx app/_global/_components/Textarea/Textarea.tsx app/trace/new/_components/TraceSourceSheet/TraceSourceSheet.tsx app/camera-check/_components/CameraCheck/CameraCheck.tsx
git commit -m "feat: 프레스 피드백 press 유틸 도입하고 상태 전환 값 명시"
```

---

## Task 12: 컨벤션 가드와 문서화

**Files:**

- Create: `app/_global/_tests/motionConvention.spec.ts`
- Modify: `AGENTS.md`

**Interfaces:**

- Consumes: 앞선 모든 태스크의 결과
- Produces: 없음

**이 태스크는 마지막이어야 한다.** 가드 테스트는 저장소 전체에 임의 duration·easing이 남아 있지 않다고 주장하므로, 마이그레이션이 끝나기 전에는 통과할 수 없다.

- [ ] **Step 1: 가드 테스트를 쓴다**

`app/_global/_tests/motionConvention.spec.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const APP_DIR = fileURLToPath(new URL('../..', import.meta.url))

// 생성물은 우리 컨벤션 대상이 아니다
const IGNORED_DIRS = new Set(['_generated'])

function collectTsxFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue
      files.push(...collectTsxFiles(join(dir, entry.name)))
      continue
    }
    if (entry.name.endsWith('.tsx')) files.push(join(dir, entry.name))
  }
  return files
}

const APP_TSX_FILES = collectTsxFiles(APP_DIR)

function findOffenders(pattern: RegExp): string[] {
  return APP_TSX_FILES.filter((file) => pattern.test(readFileSync(file, 'utf8'))).map((file) =>
    file.slice(APP_DIR.length),
  )
}

describe('모션 컨벤션', () => {
  it('스캔 대상 파일을 실제로 찾는다', () => {
    expect(APP_TSX_FILES.length).toBeGreaterThan(20)
  })

  it('duration을 숫자로 하드코딩하지 않는다 — duration-instant/fast/normal/slow만 쓴다', () => {
    expect(findOffenders(/\bduration-\d/)).toEqual([])
  })

  it('easing을 임의값으로 쓰지 않는다 — ease-enter/exit/standard만 쓴다', () => {
    expect(findOffenders(/\bease-\[/)).toEqual([])
  })

  it('컴포넌트에서 새 keyframes 애니메이션을 만들지 않는다', () => {
    // 움직임 축소 정책이 --duration-* 오버라이드로 동작해 keyframes에는 닿지 않는다.
    // 기존 스켈레톤(animate-pulse)만 예외로 남긴다.
    const offenders = findOffenders(/\banimate-(?!pulse\b)[a-z]/)
    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 2: 통과하는지 확인한다**

Run: `pnpm vitest run app/_global/_tests/motionConvention.spec.ts`
Expected: PASS (4개)

FAIL 하면 마이그레이션이 덜 끝난 것이다. 실패 메시지에 남은 파일 경로가 찍히니 그 파일을 Task 4·5·7·9·11의 방식대로 고친다. **테스트를 느슨하게 만들어서 통과시키지 말 것.**

- [ ] **Step 3: AGENTS.md에 모션 섹션을 추가한다**

`AGENTS.md`의 "참조 예시: ..." 줄 **뒤**, "## Capacitor (웹뷰 앱, iOS · Android)" 섹션 **앞**에 추가한다:

```markdown
## 모션 (애니메이션 토큰)

- duration·easing은 `globals.css`의 토큰만 쓴다. `duration-200`, `ease-[cubic-bezier(...)]` 같은 임의값은 금지다 — `motionConvention.spec.ts`가 저장소 전체를 검사한다.
  - duration: `duration-instant`(120ms 프레스·색) · `duration-fast`(180ms 백드롭·토스트·팝오버) · `duration-normal`(240ms 모달·바텀시트) · `duration-slow`(350ms 전체화면 전환)
  - easing: `ease-enter`(등장) · `ease-exit`(퇴장) · `ease-standard`(상태 전환)
- **`@keyframes` / `animate-*`를 새로 만들지 않는다.** 움직임 축소 대응이 `@media (prefers-reduced-motion) { :root { --duration-*: 1ms } }` 로 동작하므로, duration이 선언에 박히는 keyframes는 이 정책을 빠져나간다. 등장/퇴장은 전부 `transition`으로 만든다.
- JS에서 duration이 필요하면 `app/_global/_data/motion.constant.ts`의 `MOTION_DURATION`을 쓴다. CSS와 값이 어긋나면 `motionToken.spec.ts`가 잡는다.
- **모달·바텀시트는 새로 만들지 않는다.** `_components/Dialog`(중앙 모달)와 `_components/BottomSheet`(하단 시트)를 쓴다. 둘 다 base-ui 위에 있어 포커스 트랩·스크롤 락·Esc·바깥 탭 닫힘이 딸려 온다. `fixed inset-0`으로 직접 오버레이를 만들지 말 것.
- base-ui를 쓰지 않는 오버레이(전체화면 상세, 팝오버, 스플래시)의 등장/퇴장은 `useExitTransition(open, MOTION_DURATION.x)`으로 수명을 관리하고 `data-state`로 스타일을 건다. 닫히는 동안 내용이 비지 않아야 하면 `useLastPresent`를 같이 쓴다.
- 탭 가능한 요소에는 `press` 유틸을 붙여 누르는 피드백을 통일한다.
```

- [ ] **Step 4: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 통과.

- [ ] **Step 5: 프로덕션 빌드로 CSS가 실제로 나오는지 확인한다**

Run: `pnpm build`
Expected: 빌드 성공. 실패하면 `@utility` 문법이나 `globals.css` 구조 문제이므로 Task 1·11을 다시 본다.

- [ ] **Step 6: 커밋**

```bash
git add app/_global/_tests/motionConvention.spec.ts AGENTS.md
git commit -m "docs: 모션 토큰 컨벤션 문서화하고 가드 테스트 추가"
```

---

## 마무리 확인 (사람이 직접)

계획을 다 실행한 뒤 아래를 눈으로 확인한다. 자동 테스트가 못 잡는 것들이다.

- [ ] Storybook(`pnpm storybook`)에서 `BottomSheet > Toggle`, `Snackbar > Toggle`, `Dialog` 등장/퇴장 확인
- [ ] macOS 시스템 설정 → 손쉬운 사용 → 디스플레이 → "동작 줄이기"를 켜고 같은 화면에서 전환이 즉시 끝나는지 확인
- [ ] `pnpm build && pnpm start` 후 실기기 웹뷰에서 바텀시트 스크롤 락이 배경 스크롤을 제대로 막는지, 홈 인디케이터 여백이 그대로인지 확인 (`next dev`는 WKWebView에서 하이드레이션되지 않으므로 프로덕션으로 확인해야 한다)
- [ ] 로그인 게이트 모달의 새 카드 모양(반경 32, 최대 폭 343)을 디자인과 맞춰볼 것 — PR 설명에 스크린샷 첨부

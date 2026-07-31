# 흔적 남기기 플로우: OCR 표시 · TraceNote 스크롤 · 배경 일관성 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 흔적 남기기 플로우에서 OCR 인식 중임을 딤+스캔 라인으로 보여주고, TraceNote가 넘치면 스크롤(꾸미기 화면은 드래그 중 자동 스크롤로 넘친 부분도 선택 가능)하며, 3개 스텝 화면의 배경을 Figma 기준으로 통일한다.

**Architecture:** 순수 계산(자동 스크롤 델타)은 서비스로 분리해 유닛 테스트하고, UI는 기존 컴포넌트 구조를 최소 변경한다. OCR 로딩은 `useMutation`의 `isPending`으로 게이팅해 사진 스테이지 위에 오버레이한다. 스크롤은 TraceNote 고정 높이(320px)를 유지한 채 내부 스크롤로 전환한다.

**Tech Stack:** Next.js(App Router, 커스텀 빌드) · React · TanStack Query(useMutation) · Tailwind CSS v4(`@theme`) · Vitest + happy-dom + @testing-library.

**설계 문서:** `docs/superpowers/specs/2026-07-30-trace-flow-ocr-scroll-bg-design.md`
**Figma 기준:** 2295:5842 (밝은 배경 = `Background/Background` #FFFFFF = `bg-bg-default`, 어두운 밴드 = `bg-bg-dark`, 노트 하단 199px).

## Global Constraints

- **named export만** 사용 (Next 특수 파일 예외). default export 금지.
- **컴포넌트 파일은 컴포넌트 하나만** export. 내부 헬퍼는 export 금지.
- **배럴 파일 금지** (`index.ts`/`index.tsx` 생성·import 금지).
- **import 경로**: 같은 route 내부는 상대경로, `_global`/`_shared`는 `@/` 절대경로. simple-import-sort 정렬, 타입 전용은 `import type`.
- **로그**: `console.log` 금지. `console.warn`/`console.error`만 허용.
- **컴포넌트 폴더/파일 = PascalCase**, 일반 TS = camelCase, 역할 접미사 `.service.ts`/`.spec.ts` 등.
- **컴포넌트 폴더 내부에 `_hooks/`·`_services/` 중첩 금지.**
- 인용문 최대 길이 상한 `MAX_QUOTE_LENGTH = 150` 유지(변경 금지).
- 각 태스크 후 검증: `pnpm lint && pnpm typecheck && pnpm test`. 커밋 메시지는 Conventional Commits(`feat:`/`fix:`/`refactor:` 등).
- 커밋 메시지 말미에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` 포함.

---

## 파일 구조

**생성:**

- `app/trace/new/_services/noteAutoScroll.service.ts` — 드래그 가장자리→스크롤 델타 순수 함수
- `app/trace/new/_tests/noteAutoScroll.spec.ts` — 위 함수 유닛 테스트
- `app/trace/new/_components/OcrScanningOverlay/OcrScanningOverlay.tsx` — OCR 인식 중 오버레이
- `app/trace/new/_components/OcrScanningOverlay/OcrScanningOverlay.spec.tsx` — 오버레이 렌더 테스트

**수정:**

- `app/trace/new/_components/TraceNote/TraceNote.tsx` — 고정 높이 스크롤 전환 + `scrollRef` prop
- `app/trace/new/_hooks/useTextRangeSelection.ts` — 드래그 중 자동 스크롤 rAF 연동
- `app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx` — `scrollRef` 배선
- `app/trace/new/_components/OcrSelector/OcrSelector.tsx` — 스테이지 래핑 + 오버레이 렌더
- `app/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx` — 배경 구조 통일
- `app/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx` — 배경 구조 통일
- `app/globals.css` — `--animate-scan` + `@keyframes scan` 추가

> **참고(테스트 한계):** happy-dom은 레이아웃/`elementFromPoint`를 실측하지 않는다. 스크롤·자동스크롤 배선과 배경 CSS는 유닛 테스트로 검증 불가하며, `pnpm lint/typecheck/test`(회귀) + 프로덕션 빌드(`pnpm build`) + 육안 검증으로 확인한다. 순수 함수(Task 1)와 오버레이 렌더(Task 4)만 유닛 테스트 대상이다.

---

## Task 1: noteAutoScroll 순수 함수

**Files:**

- Create: `app/trace/new/_services/noteAutoScroll.service.ts`
- Test: `app/trace/new/_tests/noteAutoScroll.spec.ts`

**Interfaces:**

- Produces: `autoScrollDelta(input: { pointerY: number; top: number; height: number }): number` — 컨테이너 위/아래 가장자리(`EDGE`=40px) 안에 포인터가 있으면 그 방향으로 스크롤할 정수 px(위=음수, 아래=양수), 안쪽이면 `0`. 최대 속도 `SPEED`=10px/frame, 가장자리 침투 깊이에 비례(경계 밖은 최대치로 클램프).

- [ ] **Step 1: 실패 테스트 작성**

```ts
// app/trace/new/_tests/noteAutoScroll.spec.ts
import { describe, expect, it } from 'vitest'

import { autoScrollDelta } from '../_services/noteAutoScroll.service'

// 컨테이너: top=100, height=300 → 영역 100~400, 가장자리 40px(위 100~140, 아래 360~400)
describe('autoScrollDelta', () => {
  it('가운데면 스크롤하지 않는다', () => {
    expect(autoScrollDelta({ pointerY: 250, top: 100, height: 300 })).toBe(0)
  })

  it('위 가장자리 안이면 음수(위로 스크롤)를 준다', () => {
    expect(autoScrollDelta({ pointerY: 110, top: 100, height: 300 })).toBeLessThan(0)
  })

  it('아래 가장자리 안이면 양수(아래로 스크롤)를 준다', () => {
    expect(autoScrollDelta({ pointerY: 390, top: 100, height: 300 })).toBeGreaterThan(0)
  })

  it('위 경계(top+EDGE)에서는 스크롤하지 않는다', () => {
    expect(autoScrollDelta({ pointerY: 140, top: 100, height: 300 })).toBe(0)
  })

  it('컨테이너 밖 위쪽이면 최대 속도(음수)로 클램프된다', () => {
    expect(autoScrollDelta({ pointerY: 40, top: 100, height: 300 })).toBe(-10)
  })

  it('가장자리에 깊이 들어갈수록 크기가 커진다', () => {
    const shallow = autoScrollDelta({ pointerY: 135, top: 100, height: 300 })
    const deep = autoScrollDelta({ pointerY: 105, top: 100, height: 300 })
    expect(Math.abs(deep)).toBeGreaterThan(Math.abs(shallow))
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- noteAutoScroll`
Expected: FAIL — `autoScrollDelta` 모듈 없음.

- [ ] **Step 3: 최소 구현**

```ts
// app/trace/new/_services/noteAutoScroll.service.ts
/** 드래그가 노트 위/아래 가장자리에 닿으면 자동 스크롤한다. 가장자리 폭·최대 속도. */
const EDGE = 40
const SPEED = 10

type AutoScrollInput = {
  /** 컨테이너 높이(px) */
  height: number
  /** 포인터 clientY */
  pointerY: number
  /** 컨테이너 top(clientY 기준) */
  top: number
}

/**
 * 포인터가 위/아래 가장자리(EDGE) 안이면 그 방향으로 스크롤할 px를 준다(위=음수, 아래=양수).
 * 안쪽이면 0. 침투 깊이에 비례하고 경계 밖은 최대치로 클램프한다.
 */
export function autoScrollDelta({ height, pointerY, top }: AutoScrollInput): number {
  const bottom = top + height
  if (pointerY < top + EDGE) {
    const intensity = Math.min(1, (top + EDGE - pointerY) / EDGE)
    return -Math.ceil(SPEED * intensity)
  }
  if (pointerY > bottom - EDGE) {
    const intensity = Math.min(1, (pointerY - (bottom - EDGE)) / EDGE)
    return Math.ceil(SPEED * intensity)
  }
  return 0
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm test -- noteAutoScroll`
Expected: PASS (6개).

- [ ] **Step 5: 커밋**

```bash
git add app/trace/new/_services/noteAutoScroll.service.ts app/trace/new/_tests/noteAutoScroll.spec.ts
git commit -m "feat: 노트 드래그 자동 스크롤 델타 계산 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: TraceNote 고정 높이 스크롤 전환 + scrollRef

**Files:**

- Modify: `app/trace/new/_components/TraceNote/TraceNote.tsx`

**Interfaces:**

- Consumes: 없음.
- Produces: `TraceNote`에 optional prop `scrollRef?: Ref<HTMLDivElement>` 추가(스크롤 컨테이너 = 바깥 div에 부착). 기존 props(`decorations`, `pendingRange`, `quotedText`, `selectable`, 포인터 핸들러)는 그대로.

- [ ] **Step 1: TraceNote 교체**

`import type { ComponentPropsWithoutRef } from 'react'` 를 `import type { ComponentPropsWithoutRef, Ref } from 'react'` 로 바꾸고, props 타입에 `scrollRef`를 추가한 뒤 `return`을 아래로 교체한다. `toChars`, `DECORATED_CLASS`, `segments`, `import`(cn/서비스/타입)은 유지한다.

```tsx
type TraceNoteProps = Pick<
  ComponentPropsWithoutRef<'p'>,
  'onPointerCancel' | 'onPointerDown' | 'onPointerMove' | 'onPointerUp'
> & {
  decorations: DraftDecoration[]
  /** 효과를 적용하기 전에 골라 둔 범위. 어디에 들어갈지 미리 보여준다. */
  pendingRange?: null | TextRange
  quotedText: string
  /** 드래그 자동 스크롤을 붙일 스크롤 컨테이너. decorate 화면에서만 넘긴다. */
  scrollRef?: Ref<HTMLDivElement>
  /** 드래그로 범위를 고르는 화면에서만 켠다. 켜면 노트 위 드래그가 스크롤로 새지 않는다. */
  selectable?: boolean
}
```

```tsx
export function TraceNote({
  decorations,
  pendingRange,
  quotedText,
  scrollRef,
  selectable = false,
  ...handlers
}: TraceNoteProps) {
  const segments = splitByDecorations(quotedText, decorations)

  return (
    // 시안(2295:5843) 320px 고정. 인용문이 길면 잘리지 않고 안에서 스크롤한다.
    // h-[320px](고정 높이)여야 아래 min-h-full 퍼센트 기준이 확정된다.
    <div
      ref={scrollRef}
      className="h-[320px] overflow-x-hidden overflow-y-auto rounded-[4px] border border-border-book bg-bg-book-card drop-shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]"
    >
      {/* min-h-full: 짧으면 세로 중앙, 길면 위부터 스크롤(flex+overflow는 넘칠 때 상단이 잘리므로) */}
      <div className="flex min-h-full items-center px-6 py-10">
        <p
          {...handlers}
          className={cn(
            'text-body-20md w-full whitespace-pre-wrap text-text-secondary',
            // 동그라미 효과는 글자 사방으로 삐져나오는데 가로 스크롤 경계에 잘린다.
            // 음수 마진과 같은 크기의 패딩으로 글자 위치는 그대로 두고 그리는 경계만 넓힌다.
            '-mx-4 px-4',
            selectable && 'touch-none select-none',
          )}
        >
          {segments.map((segment, segmentIndex) => (
            <span
              key={segmentIndex}
              data-decoration-start={segment.decoration?.startOffset}
              className={segment.decoration ? DECORATED_CLASS : undefined}
              style={segment.decoration ? decorationBrushStyle(segment.decoration) : undefined}
            >
              {toChars(segment.text, segment.startOffset).map(({ char, offset }) => (
                <span
                  key={offset}
                  data-offset={offset}
                  className={cn(
                    pendingRange &&
                      offset >= pendingRange.startOffset &&
                      offset < pendingRange.endOffset &&
                      'rounded-[2px] bg-interactive-accent/30',
                  )}
                >
                  {char}
                </span>
              ))}
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 통과(기존 테스트 회귀 없음).

- [ ] **Step 3: 스토리 육안 확인(선택)**

`TraceNote.stories.tsx`에 긴 인용문(150자) 스토리가 없으면, 짧은/긴 두 경우를 확인하기 위해 Storybook 또는 이후 앱 실행에서 본다. 앱 실행 확인은 Task 6 이후 일괄로 한다.

- [ ] **Step 4: 커밋**

```bash
git add app/trace/new/_components/TraceNote/TraceNote.tsx
git commit -m "feat: TraceNote가 넘치면 잘리지 않고 내부 스크롤하게

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: 드래그 중 자동 스크롤 배선 (decorate 오버플로 선택)

**Files:**

- Modify: `app/trace/new/_hooks/useTextRangeSelection.ts`
- Modify: `app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx`

**Interfaces:**

- Consumes: `autoScrollDelta`(Task 1), `TraceNote`의 `scrollRef` prop(Task 2), 기존 `normalizeRange`(`textRange.service`).
- Produces: `useTextRangeSelection(onChange, scrollRef?)` — 2번째 인자로 스크롤 컨테이너 ref를 받으면 드래그가 가장자리에 닿을 때 rAF로 자동 스크롤하며 선택을 넓힌다. 반환은 기존과 동일(`{ handlers }`).

- [ ] **Step 1: useTextRangeSelection 교체**

파일 전체를 아래로 교체한다(내부 `anchor`를 state→ref로 바꿔 rAF 클로저의 stale를 피한다. 외부 동작·반환은 동일).

```ts
'use client'

import { type PointerEvent, type RefObject, useEffect, useRef } from 'react'

import { autoScrollDelta } from '../_services/noteAutoScroll.service'
import { normalizeRange, type TextRange } from '../_services/textRange.service'

function offsetFromPoint(x: number, y: number): number | null {
  const element = document.elementFromPoint(x, y)
  const raw = element?.getAttribute('data-offset')
  return raw === null || raw === undefined ? null : Number(raw)
}

/**
 * 인용문 위를 끌어 범위를 고른다. 고른 범위는 호출부가 들고 있다 —
 * 손을 뗀 뒤에도 어디에 효과가 들어갈지 보이려면 선택이 남아 있어야 한다.
 * scrollRef를 넘기면 드래그가 노트 가장자리에 닿을 때 자동 스크롤해 넘친 글자까지 고를 수 있다.
 */
export function useTextRangeSelection(
  onChange: (range: TextRange) => void,
  scrollRef?: RefObject<HTMLElement | null>,
) {
  const anchorRef = useRef<number | null>(null)
  const pointerRef = useRef<{ x: number; y: number } | null>(null)
  const rafRef = useRef<number | null>(null)
  // rAF 루프가 매 렌더 새로 만들어지는 onChange를 안정적으로 읽게 한다
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  const stopAutoScroll = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  // 언마운트 시 루프가 남지 않게 한다
  useEffect(() => stopAutoScroll, [])

  const tick = () => {
    const element = scrollRef?.current
    const anchor = anchorRef.current
    const pointer = pointerRef.current
    if (!element || anchor === null || !pointer) {
      stopAutoScroll()
      return
    }
    const rect = element.getBoundingClientRect()
    const delta = autoScrollDelta({ height: rect.height, pointerY: pointer.y, top: rect.top })
    if (delta === 0) {
      stopAutoScroll()
      return
    }
    element.scrollTop += delta
    // 스크롤을 반영한 뒤 포인터 밑 글자를 다시 읽어 선택을 넓힌다
    const offset = offsetFromPoint(pointer.x, pointer.y)
    if (offset !== null) onChangeRef.current(normalizeRange(anchor, offset))
    rafRef.current = requestAnimationFrame(tick)
  }

  const maybeStartAutoScroll = () => {
    const element = scrollRef?.current
    const pointer = pointerRef.current
    if (!element || !pointer || rafRef.current !== null) return
    const rect = element.getBoundingClientRect()
    if (autoScrollDelta({ height: rect.height, pointerY: pointer.y, top: rect.top }) === 0) return
    rafRef.current = requestAnimationFrame(tick)
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset === null) return
    event.currentTarget.setPointerCapture(event.pointerId)
    anchorRef.current = offset
    pointerRef.current = { x: event.clientX, y: event.clientY }
    onChange(normalizeRange(offset, offset))
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (anchorRef.current === null) return
    pointerRef.current = { x: event.clientX, y: event.clientY }
    const offset = offsetFromPoint(event.clientX, event.clientY)
    if (offset !== null) onChange(normalizeRange(anchorRef.current, offset))
    maybeStartAutoScroll()
  }

  const onPointerUp = () => {
    anchorRef.current = null
    pointerRef.current = null
    stopAutoScroll()
  }

  return { handlers: { onPointerCancel: onPointerUp, onPointerDown, onPointerMove, onPointerUp } }
}
```

- [ ] **Step 2: TraceDecorateForm 배선**

`useRef`는 이미 import되어 있다. 스크롤 ref를 만들어 훅과 TraceNote에 함께 넘긴다.

`const { handlers } = useTextRangeSelection(setRange)` 를:

```tsx
const scrollRef = useRef<HTMLDivElement>(null)
const { handlers } = useTextRangeSelection(setRange, scrollRef)
```

로 바꾸고, `<TraceNote ... />`에 `scrollRef={scrollRef}` 를 추가한다:

```tsx
<TraceNote
  quotedText={draft.quotedText}
  decorations={draft.decorations}
  pendingRange={range}
  selectable
  scrollRef={scrollRef}
  {...handlers}
  onPointerDown={handlePointerDown}
/>
```

(기존 `noteRef`는 팝오버 위치용이라 그대로 둔다.)

- [ ] **Step 3: 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 통과. (자동 스크롤 동작 자체는 happy-dom에서 미검증 — 앱 실행에서 확인.)

- [ ] **Step 4: 커밋**

```bash
git add app/trace/new/_hooks/useTextRangeSelection.ts app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx
git commit -m "feat: 꾸미기 드래그가 노트 가장자리에서 자동 스크롤해 넘친 글자도 선택

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: OcrScanningOverlay + 스캔 keyframe

**Files:**

- Create: `app/trace/new/_components/OcrScanningOverlay/OcrScanningOverlay.tsx`
- Create: `app/trace/new/_components/OcrScanningOverlay/OcrScanningOverlay.spec.tsx`
- Modify: `app/globals.css`

**Interfaces:**

- Produces: `OcrScanningOverlay`(props 없음) — 부모 `relative` 안에서 `absolute inset-0`로 사진을 딤 처리하고 스캔 라인 + "글자를 읽고 있어요"(`role="status"`)를 보여준다.

- [ ] **Step 1: 실패 테스트 작성**

```tsx
// app/trace/new/_components/OcrScanningOverlay/OcrScanningOverlay.spec.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { OcrScanningOverlay } from './OcrScanningOverlay'

describe('OcrScanningOverlay', () => {
  it('인식 중 안내를 status로 알린다', () => {
    render(<OcrScanningOverlay />)
    expect(screen.getByRole('status')).toHaveTextContent('글자를 읽고 있어요')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- OcrScanningOverlay`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 컴포넌트 구현**

```tsx
// app/trace/new/_components/OcrScanningOverlay/OcrScanningOverlay.tsx
/** OCR 인식 중, 사진 스테이지 위에 얹는 딤 + 위→아래 스캔 라인 오버레이. 부모가 relative여야 한다. */
export function OcrScanningOverlay() {
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden bg-black/45"
    >
      {/* 위→아래로 반복해 훑는 스캔 라인. 모션 최소화 설정이면 감춘다. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 h-0.5 -translate-y-1/2 animate-scan bg-gradient-to-r from-transparent via-interactive-accent to-transparent motion-reduce:hidden"
      />
      <p className="text-body-16md text-text-inverse">글자를 읽고 있어요</p>
    </div>
  )
}
```

- [ ] **Step 4: globals.css에 애니메이션 추가**

`@theme static { ... }` 블록의 닫는 `}`(현재 파일에서 타이포그래피 토큰 뒤, `body {` 바로 앞) **안쪽 마지막 줄**에 아래를 추가한다:

```css
/* OCR 인식 중 스캔 라인 — app/trace/new/OcrScanningOverlay */
--animate-scan: scan 2.2s ease-in-out infinite;
```

그리고 파일 **맨 끝**(`body { ... }` 뒤)에 keyframe을 추가한다:

```css
@keyframes scan {
  0% {
    top: 0;
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    top: 100%;
    opacity: 0;
  }
}
```

- [ ] **Step 5: 통과 확인**

Run: `pnpm test -- OcrScanningOverlay`
Expected: PASS.

- [ ] **Step 6: 검증**

Run: `pnpm lint && pnpm typecheck`
Expected: 통과.

- [ ] **Step 7: 커밋**

```bash
git add app/trace/new/_components/OcrScanningOverlay/ app/globals.css
git commit -m "feat: OCR 인식 중 딤+스캔 라인 오버레이 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: OcrSelector에 오버레이 연결

**Files:**

- Modify: `app/trace/new/_components/OcrSelector/OcrSelector.tsx`

**Interfaces:**

- Consumes: `OcrScanningOverlay`(Task 4), 기존 `ocr = useMutation(...)`의 `ocr.isPending`.
- Produces: 없음.

- [ ] **Step 1: import 추가**

`import { OcrPhotoStage } from '../OcrPhotoStage/OcrPhotoStage'` 아래(정렬 규칙 유지)에:

```tsx
import { OcrScanningOverlay } from '../OcrScanningOverlay/OcrScanningOverlay'
```

- [ ] **Step 2: 스테이지 브랜치를 래핑하고 오버레이 렌더**

현재 사진 브랜치(`) : imageUrl ? ( <OcrPhotoStage ... /> ) : (`)를 아래로 바꾼다. `OcrPhotoStage`에 넘기는 props는 그대로 두고, 상대위치 래퍼로 감싼 뒤 `ocr.isPending`일 때 오버레이를 형제로 렌더한다.

```tsx
      ) : imageUrl ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <OcrPhotoStage
            imageUrl={imageUrl}
            blocks={blocks}
            selected={selected}
            onSelect={(indices) => {
              // 절단은 파생값이라 effect에서 알리면 set-state-in-effect에 걸린다.
              // 선택이 바뀌는 이 지점에서 직접 알린다.
              if (
                joinBlockTexts(indices.map((i) => blocks[i]).filter((b) => !!b)).length >
                MAX_QUOTE_LENGTH
              )
                setMessage(QUOTE_LIMIT_MESSAGE)
              setSelected(indices)
              // 새로 끌면 손으로 고친 내용 대신 새 선택을 따른다
              setEditedText(null)
            }}
          />
          {/* 사진은 떴지만 아직 글자 인식 중인 구간 — 스테이지 위에 딤+스캔을 얹는다 */}
          {ocr.isPending && <OcrScanningOverlay />}
        </div>
      ) : (
```

- [ ] **Step 3: 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 통과(기존 OcrSelector 관련 테스트 회귀 없음).

- [ ] **Step 4: 커밋**

```bash
git add app/trace/new/_components/OcrSelector/OcrSelector.tsx
git commit -m "feat: OCR 인식 중 사진 위에 스캔 오버레이 표시

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: 배경 구조 통일 (detail·opinion → Figma/decorate 패턴)

**Files:**

- Modify: `app/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx`
- Modify: `app/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx`

**Interfaces:**

- Consumes: 없음(순수 마크업/클래스 변경). decorate(2/3)의 기존 구조를 기준으로 맞춘다.
- Produces: 없음.

> 목표 구조(모든 스텝 공통): 헤더/노트영역 배경 `bg-bg-default`(#FFF) → 노트영역 `relative`에 `absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark` 밴드 → 노트는 `relative` 래퍼 안에 두어 밴드 위로 그려지게. `-mt-4`·`bg-bg-alternative`·`pb-6` 제거.

- [ ] **Step 1: TraceDetailForm 배경 교체**

현재:

```tsx
      <div className="bg-bg-alternative pb-6">
        <TraceStepHeader step={1} title={'문장이 있는 페이지와\n스포일러 유무를 선택해주세요'} />
      </div>
      <div className="-mt-4 px-8">
        <TraceNote quotedText={draft.quotedText} decorations={[]} />
      </div>
```

교체:

```tsx
;<div className="bg-bg-default">
  <TraceStepHeader step={1} title={'문장이 있는 페이지와\n스포일러 유무를 선택해주세요'} />
</div>
{
  /* 노트가 밝음/어둠 경계를 가로지른다 — 시안(2295:5842): 노트 하단 199px가 어두운 배경 */
}
;<div className="relative bg-bg-default px-8">
  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark" />
  <div className="relative">
    <TraceNote quotedText={draft.quotedText} decorations={[]} />
  </div>
</div>
```

- [ ] **Step 2: TraceOpinionForm 배경 교체**

현재:

```tsx
      <div className="bg-bg-alternative pb-6">
        <TraceStepHeader
          step={3}
          title={'해당 대목에 남기고 싶은 흔적을\n자유롭게 작성해 주세요.'}
        />
      </div>
      <div className="-mt-4 px-8">
        <TraceNote quotedText={draft.quotedText} decorations={draft.decorations} />
      </div>
```

교체:

```tsx
;<div className="bg-bg-default">
  <TraceStepHeader step={3} title={'해당 대목에 남기고 싶은 흔적을\n자유롭게 작성해 주세요.'} />
</div>
{
  /* 노트가 밝음/어둠 경계를 가로지른다 — 시안(2295:5842): 노트 하단 199px가 어두운 배경 */
}
;<div className="relative bg-bg-default px-8">
  <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[199px] bg-bg-dark" />
  <div className="relative">
    <TraceNote quotedText={draft.quotedText} decorations={draft.decorations} />
  </div>
</div>
```

- [ ] **Step 3: 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 통과.

- [ ] **Step 4: 커밋**

```bash
git add app/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx app/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx
git commit -m "fix: 흔적 남기기 3개 스텝 배경을 시안에 맞춰 통일

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 최종 검증 (전체 태스크 후)

- [ ] `pnpm lint && pnpm typecheck && pnpm test` 전체 통과.
- [ ] `pnpm build` 성공(cacheComponents/PPR).
- [ ] 육안(브라우저 또는 웹뷰 `pnpm build && pnpm start`):
  - OCR: 사진 촬영 후 인식되는 동안 딤+스캔 라인+"글자를 읽고 있어요" 표시, 인식 완료 시 사라짐, 다시 찍기에서도 재현.
  - 스크롤: 150자 인용문에서 detail·opinion 노트가 잘리지 않고 스크롤. 짧은 인용문은 세로 중앙 정렬 유지.
  - decorate: 넘친 인용문에서 아래 가장자리로 드래그하면 자동 스크롤되며 넘친 줄까지 선택/효과 적용. 동그라미 효과가 가로로 잘리지 않음.
  - 배경: detail(1/3)·decorate(2/3)·opinion(3/3) 세 화면의 밝음/어둠 경계가 노트 중간에서 동일하게 맞음.

## Self-Review 결과

- **Spec coverage:** OCR 표시(Task 4·5), TraceNote 스크롤 3화면(Task 2), decorate 오버플로 선택(Task 1·3), 배경 일관성(Task 6), scan keyframe(Task 4), 토큰 교정 `bg-bg-alternative`→`bg-bg-default`(Task 6) — 모두 태스크 존재.
- **Placeholder scan:** TBD/모호 지시 없음. 미검증 UI는 검증 방법을 명시.
- **Type consistency:** `autoScrollDelta({ height, pointerY, top })` 시그니처가 Task 1 정의와 Task 3 사용에서 일치. `scrollRef` 타입은 TraceNote `Ref<HTMLDivElement>`, 훅 `RefObject<HTMLElement | null>`, TraceDecorateForm `useRef<HTMLDivElement>(null)`로 호환.

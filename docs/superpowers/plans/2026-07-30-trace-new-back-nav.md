# 흔적 작성 뒤로가기 재설계 구현 계획 (#94)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/trace/new` 플로우의 히스토리를 한 칸으로 고정하고, 뒤로가기를 단계 그래프 기반으로 바꿔 "눌러도 제자리"인 문제를 없앤다.

**Architecture:** 단계 이동을 전부 `router.replace`로 바꿔 히스토리 스택을 `/ → /trace/new/<현재 단계>` 2칸으로 유지한다. "이전 단계"와 "이탈 판정"은 순수 함수(`traceStepNav.service.ts`, `traceExit.service.ts`)로 분리하고, 화면 컴포넌트는 `router`를 직접 만지지 않고 `useTraceNav()`만 쓴다. 열린 시트·폼은 오버레이 스택에 등록해 이탈 시도가 그 층부터 걷어내게 한다.

**Tech Stack:** Next.js App Router, React 19 (`use()` context), TanStack Query, Vitest + @testing-library/react, Capacitor 8 (`@capacitor/app`)

**설계 스펙:** `docs/superpowers/specs/2026-07-30-trace-new-nav-and-book-add-design.md`

## Global Constraints

- **default export 금지** — named export만. Next 특수 파일(`page.tsx`, `layout.tsx` 등)은 예외.
- **배럴 파일 금지** — `index.ts` 생성·import 금지.
- 같은 route 내부는 상대경로, `_shared`/`_global`은 `@/` 절대경로.
- 컴포넌트 파일은 컴포넌트 하나만 export. 내부 헬퍼는 export하지 않는다.
- 객체 타입은 `type` 별칭 (`interface` 금지 — `consistent-type-definitions`).
- 타입 전용 import는 `import type`.
- `console.log` 금지 (`console.warn`/`console.error`만).
- 컴포넌트 폴더/파일 `PascalCase`, 일반 TS 파일 `camelCase`, 역할 접미사 `.service.ts` / `.store.ts` / `.spec.ts`.
- 컴포넌트 폴더 안에 `_hooks/`, `_services/` 같은 프라이빗 폴더를 만들지 않는다.
- feature 코드에서 `_apis` 직접 import 금지 — `@/app/_global/_queries` 경유.
- 각 태스크 마지막에 `pnpm lint && pnpm typecheck && pnpm test` 통과.
- 커밋 메시지는 Conventional Commits (`fix:`, `feat:`, `refactor:`, `test:`, `chore:`, `docs:`). commitlint가 검사한다.
- union 타입 멤버는 기존 코드 관행대로 알파벳순으로 쓴다.

## File Structure

**신규**

| 파일                                                                      | 책임                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------ |
| `app/trace/new/_services/traceStepNav.service.ts`                         | 경로↔단계 매핑, 단계별 "이전 단계" 결정 (순수 함수)    |
| `app/trace/new/_services/traceExit.service.ts`                            | 이탈 시도 판정 (`closeOverlay` / `exit` / `confirm`)   |
| `app/trace/new/_data/traceOverlay.store.ts`                               | 오버레이 스택 Context와 타입                           |
| `app/trace/new/_data/traceNav.store.ts`                                   | 내비게이션 Context와 타입                              |
| `app/trace/new/_components/TraceOverlayProvider/TraceOverlayProvider.tsx` | 열린 오버레이 스택 보관                                |
| `app/trace/new/_components/TraceNavProvider/TraceNavProvider.tsx`         | 단계 이동·이탈 판정·확인 다이얼로그·하드웨어 back 배선 |
| `app/trace/new/_components/TraceExitDialog/TraceExitDialog.tsx`           | 작성 중 이탈 확인 다이얼로그                           |
| `app/trace/new/_hooks/useTraceNav.ts`                                     | `TraceNavContext` 소비 훅                              |
| `app/trace/new/_hooks/useOverlayBackGuard.ts`                             | 오버레이 열림 동안 스택에 등록                         |
| `app/trace/new/_hooks/useHardwareBack.ts`                                 | Capacitor `backButton` 리스너                          |
| `app/trace/new/_tests/traceStepNav.spec.ts`                               | 단계 그래프 테스트                                     |
| `app/trace/new/_tests/traceExit.spec.ts`                                  | 이탈 판정 테스트                                       |
| `app/trace/new/_tests/traceStepNavigation.spec.tsx`                       | 화면 전환이 `replace`로 일어나는지 통합 검증           |

**수정**

| 파일                                                                | 변경                                                  |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| `app/trace/new/_types/traceDraft.type.ts`                           | `clearQuote` 액션 추가                                |
| `app/trace/new/_data/traceDraft.store.ts`                           | `clearQuote` case 추가                                |
| `app/trace/new/layout.tsx`                                          | Provider 2개 추가                                     |
| `app/trace/new/_components/BookPicker/BookPicker.tsx`               | `router.back()` → `requestExit()`, 시트 오버레이 등록 |
| `app/trace/new/_components/OcrSelector/OcrSelector.tsx`             | `router.back()`·`push` → `goBack()`·`goTo()`          |
| `app/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx`     | 동일                                                  |
| `app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx` | 동일 + `MergeDialog` 오버레이 등록                    |
| `app/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx`   | 동일                                                  |
| `app/trace/new/_components/TraceDoneView/TraceDoneView.tsx`         | `push` → `replace`                                    |
| `app/trace/new/_components/TraceStepHeader/TraceStepHeader.tsx`     | X 버튼이 `requestExit()` 호출                         |
| `app/trace/new/_tests/traceDraft.spec.ts`                           | `clearQuote` 테스트 추가                              |
| `docs/capacitor.md`                                                 | `@capacitor/app` 추가 사실과 재설치 필요성 기록       |
| `package.json`                                                      | `@capacitor/app` 의존성                               |

---

### Task 1: 단계 그래프 서비스

**Files:**

- Create: `app/trace/new/_services/traceStepNav.service.ts`
- Test: `app/trace/new/_tests/traceStepNav.spec.ts`

**Interfaces:**

- Consumes: 없음 (순수 함수, 첫 태스크)
- Produces:
  - `type TraceStep = 'decorate' | 'detail' | 'done' | 'opinion' | 'photo' | 'search'`
  - `type TraceBackTarget = { type: 'exit' } | { clearQuote: boolean; step: TraceStep; type: 'step' }`
  - `stepPath(step: TraceStep): string`
  - `resolveStep(pathname: string): TraceStep | null`
  - `resolveBackTarget(step: TraceStep): TraceBackTarget`

- [ ] **Step 1: 실패하는 테스트 작성**

`app/trace/new/_tests/traceStepNav.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import { resolveBackTarget, resolveStep, stepPath } from '../_services/traceStepNav.service'

describe('resolveStep', () => {
  it('경로를 단계로 바꾼다', () => {
    expect(resolveStep('/trace/new')).toBe('search')
    expect(resolveStep('/trace/new/photo')).toBe('photo')
    expect(resolveStep('/trace/new/detail')).toBe('detail')
    expect(resolveStep('/trace/new/decorate')).toBe('decorate')
    expect(resolveStep('/trace/new/opinion')).toBe('opinion')
    expect(resolveStep('/trace/new/done')).toBe('done')
  })

  it('플로우 밖 경로는 null이다', () => {
    expect(resolveStep('/')).toBeNull()
    expect(resolveStep('/trace/12')).toBeNull()
  })
})

describe('stepPath', () => {
  it('단계를 경로로 바꾼다', () => {
    expect(stepPath('search')).toBe('/trace/new')
    expect(stepPath('done')).toBe('/trace/new/done')
  })
})

describe('resolveBackTarget', () => {
  it('사진·상세에서 뒤로 가면 대목을 비우고 책 검색으로 돌아간다', () => {
    // 사진과 OCR 블록은 draft에 없어 photo 재진입이 카메라를 다시 여는 것 말고 할 일이 없다.
    // 대목을 비워야 BookPicker가 방식 선택 시트를 다시 연다.
    expect(resolveBackTarget('photo')).toEqual({ clearQuote: true, step: 'search', type: 'step' })
    expect(resolveBackTarget('detail')).toEqual({ clearQuote: true, step: 'search', type: 'step' })
  })

  it('꾸미기·의견에서 뒤로 가면 대목을 유지한 채 한 단계만 되돌린다', () => {
    expect(resolveBackTarget('decorate')).toEqual({
      clearQuote: false,
      step: 'detail',
      type: 'step',
    })
    expect(resolveBackTarget('opinion')).toEqual({
      clearQuote: false,
      step: 'decorate',
      type: 'step',
    })
  })

  it('첫 화면과 완료 화면에서 뒤로 가면 플로우를 벗어난다', () => {
    expect(resolveBackTarget('search')).toEqual({ type: 'exit' })
    expect(resolveBackTarget('done')).toEqual({ type: 'exit' })
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceStepNav.spec.ts`
Expected: FAIL — `Failed to resolve import "../_services/traceStepNav.service"`

- [ ] **Step 3: 서비스 구현**

`app/trace/new/_services/traceStepNav.service.ts`

```ts
export type TraceStep = 'decorate' | 'detail' | 'done' | 'opinion' | 'photo' | 'search'

/** 뒤로가기가 향할 곳. exit는 플로우 자체를 벗어나는 것이라 이탈 판정을 한 번 더 거친다. */
export type TraceBackTarget =
  { clearQuote: boolean; step: TraceStep; type: 'step' } | { type: 'exit' }

const START = '/trace/new'

const STEP_PATH: Record<TraceStep, string> = {
  decorate: `${START}/decorate`,
  detail: `${START}/detail`,
  done: `${START}/done`,
  opinion: `${START}/opinion`,
  photo: `${START}/photo`,
  search: START,
}

const STEPS = Object.keys(STEP_PATH) as TraceStep[]

export function stepPath(step: TraceStep): string {
  return STEP_PATH[step]
}

export function resolveStep(pathname: string): TraceStep | null {
  return STEPS.find((step) => STEP_PATH[step] === pathname) ?? null
}

export function resolveBackTarget(step: TraceStep): TraceBackTarget {
  switch (step) {
    // 사진·직접입력 어느 쪽이든 방식 선택으로 되돌린다. photo로 되돌리면 카메라가 다시 열린다.
    case 'detail':
    case 'photo':
      return { clearQuote: true, step: 'search', type: 'step' }
    case 'decorate':
      return { clearQuote: false, step: 'detail', type: 'step' }
    case 'opinion':
      return { clearQuote: false, step: 'decorate', type: 'step' }
    case 'done':
    case 'search':
      return { type: 'exit' }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceStepNav.spec.ts`
Expected: PASS (11 assertions, 6 tests)

- [ ] **Step 5: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add app/trace/new/_services/traceStepNav.service.ts app/trace/new/_tests/traceStepNav.spec.ts
git commit -m "feat: 흔적 작성 단계 그래프를 서비스로 분리한다"
```

---

### Task 2: `clearQuote` 리듀서 액션

**Files:**

- Modify: `app/trace/new/_types/traceDraft.type.ts:33-45`
- Modify: `app/trace/new/_data/traceDraft.store.ts:23-65`
- Test: `app/trace/new/_tests/traceDraft.spec.ts` (기존 파일에 케이스 추가)

**Interfaces:**

- Consumes: Task 1의 `resolveBackTarget`이 돌려주는 `clearQuote: true`가 이 액션을 트리거한다
- Produces: `{ type: 'clearQuote' }` 액션 — `book`·`source`는 남기고 `quotedText`·`decorations`·`pageNumber`·`isSpoiler`·`passageId`를 초기화

- [ ] **Step 1: 실패하는 테스트 작성**

`app/trace/new/_tests/traceDraft.spec.ts`의 `reset은 전부 비운다` 테스트 **위**에 추가.

```ts
it('clearQuote는 책과 입력 방식만 남기고 대목을 비운다', () => {
  const filled = [
    { type: 'selectBook', book } as const,
    { type: 'setSource', source: 'photo' } as const,
    { type: 'setQuotedText', quotedText: '어떤 문장' } as const,
    { type: 'setPageDetail', pageNumber: 87, isSpoiler: true } as const,
    { type: 'applyDecoration', decoration: decoration(0, 5) } as const,
    { type: 'setMergeTarget', passageId: 9 } as const,
  ].reduce(traceDraftReducer, initialTraceDraft)

  const next = traceDraftReducer(filled, { type: 'clearQuote' })

  expect(next.book).toEqual(book)
  expect(next.source).toBe('photo')
  expect(next.quotedText).toBe('')
  expect(next.decorations).toEqual([])
  expect(next.pageNumber).toBeNull()
  expect(next.isSpoiler).toBe(false)
  expect(next.passageId).toBeNull()
})

it('clearQuote는 의견 본문을 지우지 않는다', () => {
  // 대목을 다시 고르러 나갔다 돌아오는 흐름이라, 이미 쓴 의견을 날릴 이유가 없다.
  const filled = [
    { type: 'selectBook', book } as const,
    { type: 'setContent', content: '내 의견' } as const,
  ].reduce(traceDraftReducer, initialTraceDraft)

  expect(traceDraftReducer(filled, { type: 'clearQuote' }).content).toBe('내 의견')
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceDraft.spec.ts`
Expected: FAIL — 타입 에러 또는 `clearQuote`가 switch에서 처리되지 않아 `undefined` 반환

- [ ] **Step 3: 타입과 리듀서 구현**

`app/trace/new/_types/traceDraft.type.ts` — `TraceDraftAction` union에 추가 (`applyDecoration` 앞, 알파벳 순서 무관하게 기존 스타일대로 관련 액션 근처):

```ts
export type TraceDraftAction =
  | { type: 'selectBook'; book: SelectedBook }
  | { type: 'setSource'; source: 'manual' | 'photo' }
  | { type: 'setQuotedText'; quotedText: string }
  /** 대목을 다시 고르러 첫 화면으로 되돌아갈 때. 책과 입력 방식은 남긴다. */
  | { type: 'clearQuote' }
  | { type: 'setPageDetail'; pageNumber: number; isSpoiler: boolean }
  | { type: 'applyDecoration'; decoration: DraftDecoration }
  | { type: 'recolorDecoration'; startOffset: number; color: string }
  | { type: 'removeDecoration'; startOffset: number }
  | { type: 'setContent'; content: string }
  | { type: 'setMergeTarget'; passageId: number | null }
  | { type: 'setResult'; result: { opinionId: number; merged: boolean } }
  | { type: 'resetKeepingBook' }
  | { type: 'reset' }
```

`app/trace/new/_data/traceDraft.store.ts` — `setQuotedText` case 아래에 추가:

```ts
    case 'clearQuote':
      // BookPicker는 book이 있고 quotedText가 비어 있을 때 방식 선택 시트를 연다.
      // 페이지·효과·병합 대상은 모두 이 대목에 매인 값이라 함께 비운다.
      return {
        ...state,
        quotedText: '',
        decorations: [],
        pageNumber: null,
        isSpoiler: false,
        passageId: null,
      }
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceDraft.spec.ts`
Expected: PASS (기존 11 + 신규 2 테스트)

- [ ] **Step 5: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add app/trace/new/_types/traceDraft.type.ts app/trace/new/_data/traceDraft.store.ts app/trace/new/_tests/traceDraft.spec.ts
git commit -m "feat: 대목만 비우는 clearQuote 액션을 추가한다"
```

---

### Task 3: 이탈 판정 서비스

**Files:**

- Create: `app/trace/new/_services/traceExit.service.ts`
- Test: `app/trace/new/_tests/traceExit.spec.ts`

**Interfaces:**

- Consumes: `TraceStep` (Task 1), `TraceDraft` (`_types/traceDraft.type.ts`)
- Produces:
  - `type TraceExitDecision = 'closeOverlay' | 'confirm' | 'exit'`
  - `resolveExitDecision(input: { draft: TraceDraft; hasOverlay: boolean; step: TraceStep | null }): TraceExitDecision`

- [ ] **Step 1: 실패하는 테스트 작성**

`app/trace/new/_tests/traceExit.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import { initialTraceDraft } from '../_data/traceDraft.store'
import { resolveExitDecision } from '../_services/traceExit.service'
import type { SelectedBook, TraceDraft } from '../_types/traceDraft.type'

const book: SelectedBook = {
  bookId: 1,
  title: '채식주의자',
  author: '한강',
  coverImageUrl: null,
  pageCount: 268,
}

const draftWith = (overrides: Partial<TraceDraft>): TraceDraft => ({
  ...initialTraceDraft,
  ...overrides,
})

describe('resolveExitDecision', () => {
  it('오버레이가 열려 있으면 그 층만 닫는다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({ book, quotedText: '문장' }),
        hasOverlay: true,
        step: 'detail',
      }),
    ).toBe('closeOverlay')
  })

  it('완료 화면은 확인 없이 나간다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({ result: { opinionId: 1, merged: false } }),
        hasOverlay: false,
        step: 'done',
      }),
    ).toBe('exit')
  })

  it('책만 고른 상태는 확인 없이 나간다', () => {
    expect(
      resolveExitDecision({ draft: draftWith({ book }), hasOverlay: false, step: 'search' }),
    ).toBe('exit')
  })

  it('아무것도 고르지 않은 첫 화면은 확인 없이 나간다', () => {
    expect(
      resolveExitDecision({ draft: initialTraceDraft, hasOverlay: false, step: 'search' }),
    ).toBe('exit')
  })

  it('대목을 담았으면 확인을 받는다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({ book, quotedText: '문장' }),
        hasOverlay: false,
        step: 'detail',
      }),
    ).toBe('confirm')
  })

  it('효과만 넣었어도 확인을 받는다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({
          book,
          decorations: [{ startOffset: 0, endOffset: 2, effectType: 'UNDERLINE', color: '#fff' }],
        }),
        hasOverlay: false,
        step: 'decorate',
      }),
    ).toBe('confirm')
  })

  it('의견만 썼어도 확인을 받는다', () => {
    expect(
      resolveExitDecision({
        draft: draftWith({ book, content: '내 의견' }),
        hasOverlay: false,
        step: 'opinion',
      }),
    ).toBe('confirm')
  })

  it('저장이 끝난 draft는 어느 단계에서도 확인하지 않는다', () => {
    // guard가 done으로 되돌리는 중간 프레임에서 확인 다이얼로그가 뜨면 안 된다.
    expect(
      resolveExitDecision({
        draft: draftWith({
          book,
          quotedText: '문장',
          content: '내 의견',
          result: { opinionId: 1, merged: false },
        }),
        hasOverlay: false,
        step: 'opinion',
      }),
    ).toBe('exit')
  })

  it('단계를 알 수 없으면 그냥 나간다', () => {
    expect(resolveExitDecision({ draft: initialTraceDraft, hasOverlay: false, step: null })).toBe(
      'exit',
    )
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceExit.spec.ts`
Expected: FAIL — `Failed to resolve import "../_services/traceExit.service"`

- [ ] **Step 3: 서비스 구현**

`app/trace/new/_services/traceExit.service.ts`

```ts
import type { TraceDraft } from '../_types/traceDraft.type'
import type { TraceStep } from './traceStepNav.service'

export type TraceExitDecision = 'closeOverlay' | 'confirm' | 'exit'

type ExitInput = {
  draft: TraceDraft
  /** 지금 닫을 수 있는 시트·폼·다이얼로그가 있는지 */
  hasOverlay: boolean
  step: TraceStep | null
}

/** 책 선택만으로는 잃을 것이 없다. 손으로 만든 값이 하나라도 있으면 확인을 받는다. */
function hasUnsavedWork(draft: TraceDraft): boolean {
  return draft.quotedText.length > 0 || draft.decorations.length > 0 || draft.content.length > 0
}

export function resolveExitDecision({ draft, hasOverlay, step }: ExitInput): TraceExitDecision {
  if (hasOverlay) return 'closeOverlay'
  if (step === null || step === 'done') return 'exit'
  // 이미 저장된 흔적이면 남은 draft는 결과 화면용 사본일 뿐이라 잃을 것이 없다.
  if (draft.result !== null) return 'exit'
  return hasUnsavedWork(draft) ? 'confirm' : 'exit'
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceExit.spec.ts`
Expected: PASS (9 tests)

- [ ] **Step 5: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add app/trace/new/_services/traceExit.service.ts app/trace/new/_tests/traceExit.spec.ts
git commit -m "feat: 흔적 작성 이탈 판정을 서비스로 분리한다"
```

---

### Task 4: 오버레이 스택

**Files:**

- Create: `app/trace/new/_data/traceOverlay.store.ts`
- Create: `app/trace/new/_components/TraceOverlayProvider/TraceOverlayProvider.tsx`
- Create: `app/trace/new/_hooks/useOverlayBackGuard.ts`
- Test: `app/trace/new/_tests/traceOverlay.spec.tsx`

**Interfaces:**

- Consumes: 없음
- Produces:
  - `TraceOverlayContext` — `{ closeTop: () => boolean; hasOverlay: () => boolean; register: (close: () => void) => () => void }`
  - `TraceOverlayProvider` 컴포넌트
  - `useOverlayBackGuard(open: boolean, close: () => void): void` — `open`인 동안 스택에 등록

- [ ] **Step 1: 실패하는 테스트 작성**

`app/trace/new/_tests/traceOverlay.spec.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useOverlayBackGuard } from '../_hooks/useOverlayBackGuard'
import { useTraceOverlay } from '../_hooks/useTraceOverlay'

function Sheet({ label, onClose, open }: { label: string; onClose: () => void; open: boolean }) {
  useOverlayBackGuard(open, onClose)
  return open ? <p>{label} 열림</p> : null
}

function Harness() {
  const [first, setFirst] = useState(false)
  const [second, setSecond] = useState(false)
  const overlay = useTraceOverlay()

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFirst(true)
        }}
      >
        첫 시트 열기
      </button>
      <button
        type="button"
        onClick={() => {
          setSecond(true)
        }}
      >
        둘째 시트 열기
      </button>
      <button
        type="button"
        onClick={() => {
          overlay.closeTop()
        }}
      >
        뒤로
      </button>
      <p>오버레이 있음: {String(overlay.hasOverlay())}</p>
      <Sheet
        label="첫"
        open={first}
        onClose={() => {
          setFirst(false)
        }}
      />
      <Sheet
        label="둘째"
        open={second}
        onClose={() => {
          setSecond(false)
        }}
      />
    </>
  )
}

describe('오버레이 스택', () => {
  it('닫을 오버레이가 없으면 closeTop이 false를 돌려준다', () => {
    const spy = vi.fn()
    function Probe() {
      const overlay = useTraceOverlay()
      return (
        <button
          type="button"
          onClick={() => {
            spy(overlay.closeTop())
          }}
        >
          뒤로
        </button>
      )
    }
    render(
      <TraceOverlayProvider>
        <Probe />
      </TraceOverlayProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(spy).toHaveBeenCalledWith(false)
  })

  it('가장 나중에 열린 오버레이부터 닫는다', () => {
    render(
      <TraceOverlayProvider>
        <Harness />
      </TraceOverlayProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: '첫 시트 열기' }))
    fireEvent.click(screen.getByRole('button', { name: '둘째 시트 열기' }))
    expect(screen.getByText('오버레이 있음: true')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.queryByText('둘째 열림')).toBeNull()
    expect(screen.getByText('첫 열림')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))
    expect(screen.queryByText('첫 열림')).toBeNull()
    expect(screen.getByText('오버레이 있음: false')).toBeTruthy()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceOverlay.spec.tsx`
Expected: FAIL — `Failed to resolve import "../_components/TraceOverlayProvider/TraceOverlayProvider"`

- [ ] **Step 3: Context·Provider·훅 구현**

`app/trace/new/_data/traceOverlay.store.ts`

```ts
'use client'

import { createContext } from 'react'

export type TraceOverlayRegistry = {
  /** 가장 나중에 등록된 오버레이를 닫는다. 닫을 것이 없으면 false. */
  closeTop: () => boolean
  hasOverlay: () => boolean
  /** 오버레이를 등록하고, 해제 함수를 돌려준다. */
  register: (close: () => void) => () => void
}

export const TraceOverlayContext = createContext<TraceOverlayRegistry | null>(null)
```

`app/trace/new/_components/TraceOverlayProvider/TraceOverlayProvider.tsx`

```tsx
'use client'

import { type ReactNode, useMemo, useRef } from 'react'

import { TraceOverlayContext, type TraceOverlayRegistry } from '../../_data/traceOverlay.store'

/**
 * 열려 있는 시트·폼·다이얼로그를 쌓아 두고, 이탈 시도가 위에서부터 한 층씩 걷어내게 한다.
 * 스택은 ref에 둔다 — 등록·해제가 렌더를 유발하면 오버레이를 여는 순간 화면이 한 번 더 그려진다.
 */
export function TraceOverlayProvider({ children }: { children: ReactNode }) {
  const stackRef = useRef<(() => void)[]>([])

  const value = useMemo<TraceOverlayRegistry>(
    () => ({
      closeTop: () => {
        const top = stackRef.current.at(-1)
        if (!top) return false
        top()
        return true
      },
      hasOverlay: () => stackRef.current.length > 0,
      register: (close) => {
        stackRef.current = [...stackRef.current, close]
        return () => {
          stackRef.current = stackRef.current.filter((item) => item !== close)
        }
      },
    }),
    [],
  )

  return <TraceOverlayContext value={value}>{children}</TraceOverlayContext>
}
```

`app/trace/new/_hooks/useTraceOverlay.ts`

```ts
'use client'

import { use } from 'react'

import { TraceOverlayContext } from '../_data/traceOverlay.store'

export function useTraceOverlay() {
  const value = use(TraceOverlayContext)
  if (!value) throw new Error('useTraceOverlay는 TraceOverlayProvider 안에서만 쓸 수 있습니다.')
  return value
}
```

`app/trace/new/_hooks/useOverlayBackGuard.ts`

```ts
'use client'

import { useEffect, useRef } from 'react'

import { useTraceOverlay } from './useTraceOverlay'

/**
 * open인 동안 오버레이 스택에 등록해, 뒤로가기가 화면을 떠나는 대신 이 층을 닫게 한다.
 * close는 매 렌더 새로 만들어지는 경우가 많아 ref로 최신 값을 참조한다
 * (등록 함수 자체를 의존성에 넣으면 열려 있는 동안 등록·해제가 반복된다).
 */
export function useOverlayBackGuard(open: boolean, close: () => void): void {
  const { register } = useTraceOverlay()
  const closeRef = useRef(close)

  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    if (!open) return
    return register(() => {
      closeRef.current()
    })
  }, [open, register])
}
```

> `useTraceOverlay.ts`도 신규 파일이다. File Structure 표에 함께 반영해 커밋한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceOverlay.spec.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add app/trace/new/_data/traceOverlay.store.ts app/trace/new/_components/TraceOverlayProvider app/trace/new/_hooks/useTraceOverlay.ts app/trace/new/_hooks/useOverlayBackGuard.ts app/trace/new/_tests/traceOverlay.spec.tsx
git commit -m "feat: 흔적 작성 오버레이 스택을 추가한다"
```

---

### Task 5: 내비게이션 Provider와 이탈 다이얼로그

**Files:**

- Create: `app/trace/new/_data/traceNav.store.ts`
- Create: `app/trace/new/_components/TraceNavProvider/TraceNavProvider.tsx`
- Create: `app/trace/new/_components/TraceExitDialog/TraceExitDialog.tsx`
- Create: `app/trace/new/_hooks/useTraceNav.ts`
- Modify: `app/trace/new/layout.tsx`

**Interfaces:**

- Consumes: `resolveStep` / `stepPath` / `resolveBackTarget` / `TraceStep` (Task 1), `clearQuote` 액션 (Task 2), `resolveExitDecision` (Task 3), `useTraceOverlay` (Task 4)
- Produces:
  - `TraceNavContext` — `{ goBack: () => void; goTo: (step: TraceStep) => void; requestExit: () => void; step: TraceStep | null }`
  - `useTraceNav(): TraceNav`
  - `TraceNavProvider` (확인 다이얼로그를 함께 렌더)

- [ ] **Step 1: Context와 타입 작성**

`app/trace/new/_data/traceNav.store.ts`

```ts
'use client'

import { createContext } from 'react'

import type { TraceStep } from '../_services/traceStepNav.service'

export type TraceNav = {
  /** 단계 그래프상 이전 단계로. 이전이 없으면 이탈 판정으로 넘어간다. */
  goBack: () => void
  goTo: (step: TraceStep) => void
  /** 플로우를 벗어나려는 시도. 오버레이 닫기·즉시 이탈·확인 다이얼로그 중 하나가 된다. */
  requestExit: () => void
  step: TraceStep | null
}

export const TraceNavContext = createContext<TraceNav | null>(null)
```

`app/trace/new/_hooks/useTraceNav.ts`

```ts
'use client'

import { use } from 'react'

import { TraceNavContext } from '../_data/traceNav.store'

export function useTraceNav() {
  const value = use(TraceNavContext)
  if (!value) throw new Error('useTraceNav는 TraceNavProvider 안에서만 쓸 수 있습니다.')
  return value
}
```

- [ ] **Step 2: 확인 다이얼로그 작성**

`app/trace/new/_components/TraceExitDialog/TraceExitDialog.tsx`

```tsx
'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { Dialog } from '@/app/_global/_components/Dialog/Dialog'

type TraceExitDialogProps = {
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}

export function TraceExitDialog({ onCancel, onConfirm, open }: TraceExitDialogProps) {
  return (
    <Dialog.Root open={open}>
      <Dialog.Content>
        <Dialog.Illustration />
        <Dialog.Header>
          <Dialog.Title>{'지금 나가면\n작성 중이던 흔적이 사라져요'}</Dialog.Title>
          <Dialog.Description>남긴 문장과 의견은 저장되지 않아요.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="back" onClick={onCancel}>
            이어서 쓸게요
          </Button>
          <Button variant="activated" onClick={onConfirm}>
            나갈게요
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  )
}
```

- [ ] **Step 3: Provider 작성**

`app/trace/new/_components/TraceNavProvider/TraceNavProvider.tsx`

```tsx
'use client'

import { usePathname, useRouter } from 'next/navigation'
import { type ReactNode, useState } from 'react'

import { TraceNavContext, type TraceNav } from '../../_data/traceNav.store'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceOverlay } from '../../_hooks/useTraceOverlay'
import { resolveExitDecision } from '../../_services/traceExit.service'
import {
  resolveBackTarget,
  resolveStep,
  stepPath,
  type TraceStep,
} from '../../_services/traceStepNav.service'
import { TraceExitDialog } from '../TraceExitDialog/TraceExitDialog'

const HOME_PATH = '/'

/**
 * 플로우 안의 모든 이동을 replace로 처리해 히스토리를 '/ → 현재 단계' 2칸으로 묶는다.
 * push로 쌓으면 뒤로가기가 이전 단계로 갔다가 guard의 replace에 되밀려 제자리에 머문다.
 */
export function TraceNavProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { dispatch, draft } = useTraceDraft()
  const overlay = useTraceOverlay()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const step = resolveStep(pathname)

  const leaveFlow = () => {
    setIsConfirmOpen(false)
    dispatch({ type: 'reset' })
    router.replace(HOME_PATH)
  }

  const requestExit = () => {
    const decision = resolveExitDecision({ draft, hasOverlay: overlay.hasOverlay(), step })
    if (decision === 'closeOverlay') {
      overlay.closeTop()
      return
    }
    if (decision === 'confirm') {
      setIsConfirmOpen(true)
      return
    }
    leaveFlow()
  }

  const value: TraceNav = {
    goBack: () => {
      if (!step) {
        requestExit()
        return
      }
      const target = resolveBackTarget(step)
      if (target.type === 'exit') {
        requestExit()
        return
      }
      if (target.clearQuote) dispatch({ type: 'clearQuote' })
      router.replace(stepPath(target.step))
    },
    goTo: (next: TraceStep) => {
      router.replace(stepPath(next))
    },
    requestExit,
    step,
  }

  return (
    <TraceNavContext value={value}>
      {children}
      <TraceExitDialog
        open={isConfirmOpen}
        onCancel={() => {
          setIsConfirmOpen(false)
        }}
        onConfirm={leaveFlow}
      />
    </TraceNavContext>
  )
}
```

- [ ] **Step 4: 레이아웃 배선**

`app/trace/new/layout.tsx` 전체를 이렇게 바꾼다.

```tsx
import type { ReactNode } from 'react'

import { TraceDraftProvider } from './_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from './_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from './_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceStepGuard } from './_components/TraceStepGuard/TraceStepGuard'

export default function TraceNewLayout({ children }: { children: ReactNode }) {
  return (
    <TraceDraftProvider>
      <TraceOverlayProvider>
        <TraceNavProvider>
          <TraceStepGuard>{children}</TraceStepGuard>
        </TraceNavProvider>
      </TraceOverlayProvider>
    </TraceDraftProvider>
  )
}
```

- [ ] **Step 5: 타입·lint 확인**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS. 아직 화면들이 `useTraceNav`를 쓰지 않으므로 동작 변화는 없다.

- [ ] **Step 6: 커밋**

```bash
git add app/trace/new/_data/traceNav.store.ts app/trace/new/_hooks/useTraceNav.ts app/trace/new/_components/TraceNavProvider app/trace/new/_components/TraceExitDialog app/trace/new/layout.tsx
git commit -m "feat: 흔적 작성 내비게이션 Provider와 이탈 확인 다이얼로그를 추가한다"
```

---

### Task 6: 화면 전환을 replace로 교체

**Files:**

- Modify: `app/trace/new/_components/BookPicker/BookPicker.tsx:106-201`
- Modify: `app/trace/new/_components/OcrSelector/OcrSelector.tsx:57-197`
- Modify: `app/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx:79-105`
- Modify: `app/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx:66-68,155-200`
- Modify: `app/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx:50-56,105-115`
- Modify: `app/trace/new/_components/TraceDoneView/TraceDoneView.tsx:38-60`
- Modify: `app/trace/new/_components/TraceStepHeader/TraceStepHeader.tsx:13-38`
- Test: `app/trace/new/_tests/traceStepNavigation.spec.tsx`

**Interfaces:**

- Consumes: `useTraceNav()` (Task 5), `useOverlayBackGuard` (Task 4)
- Produces: 화면 컴포넌트에서 `useRouter` 사용이 사라진다 (`TraceDoneView`의 홈 이동만 예외적으로 `replace` 사용)

- [ ] **Step 1: 실패하는 통합 테스트 작성**

`app/trace/new/_tests/traceStepNavigation.spec.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'
import { useTraceNav } from '../_hooks/useTraceNav'

const { navState } = vi.hoisted(() => ({ navState: { pathname: '/trace/new' } }))
const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

// 대목이 담긴 draft에서 뒤로/이탈을 시도하는 최소 화면
function Probe() {
  const { dispatch } = useTraceDraft()
  const { goBack, requestExit } = useTraceNav()

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dispatch({
            type: 'selectBook',
            book: {
              bookId: 1,
              title: '채식주의자',
              author: '한강',
              coverImageUrl: null,
              pageCount: 268,
            },
          })
          dispatch({ type: 'setQuotedText', quotedText: '문장' })
        }}
      >
        대목 담기
      </button>
      <button type="button" onClick={goBack}>
        뒤로
      </button>
      <button type="button" onClick={requestExit}>
        닫기
      </button>
    </>
  )
}

function renderAt(pathname: string) {
  navState.pathname = pathname
  return render(
    <TraceDraftProvider>
      <TraceOverlayProvider>
        <TraceNavProvider>
          <Probe />
        </TraceNavProvider>
      </TraceOverlayProvider>
    </TraceDraftProvider>,
  )
}

describe('흔적 작성 단계 이동', () => {
  beforeEach(() => {
    pushMock.mockClear()
    replaceMock.mockClear()
  })

  it('꾸미기에서 뒤로 가면 push 없이 상세로 replace한다', () => {
    renderAt('/trace/new/decorate')
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

    expect(replaceMock).toHaveBeenCalledWith('/trace/new/detail')
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('상세에서 뒤로 가면 책 검색으로 replace한다', () => {
    renderAt('/trace/new/detail')
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

    expect(replaceMock).toHaveBeenCalledWith('/trace/new')
  })

  it('작성 중 닫기를 누르면 바로 나가지 않고 확인을 받는다', () => {
    renderAt('/trace/new/detail')
    fireEvent.click(screen.getByRole('button', { name: '대목 담기' }))
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(replaceMock).not.toHaveBeenCalled()
    expect(screen.getByText('나갈게요')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '나갈게요' }))
    expect(replaceMock).toHaveBeenCalledWith('/')
  })

  it('책만 고른 상태에서 닫기를 누르면 확인 없이 나간다', () => {
    renderAt('/trace/new')
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(replaceMock).toHaveBeenCalledWith('/')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run app/trace/new/_tests/traceStepNavigation.spec.tsx`
Expected: 4개 중 최소 1개 FAIL — Task 5까지만 끝난 상태에서는 Provider가 있으니 통과할 수도 있다. 통과하면 그대로 두고 Step 3으로 간다(이 테스트는 Task 6의 회귀 방지용이다).

- [ ] **Step 3: `BookPicker` 수정**

`useRouter` import를 지우고 `useTraceNav`·`useOverlayBackGuard`를 쓴다.

```tsx
import { useTraceNav } from '../../_hooks/useTraceNav'
import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
```

컴포넌트 상단:

```tsx
const { goTo, requestExit } = useTraceNav()
```

시트를 오버레이 스택에 등록한다(선언은 `sheet` state 아래).

```tsx
// 시트가 열려 있으면 뒤로가기가 화면을 떠나는 대신 시트만 닫는다
useOverlayBackGuard(sheet !== 'none', () => {
  setSheet('none')
})
```

TopBar 뒤로 버튼:

```tsx
        <TopBar.Action
          aria-label="뒤로"
          onClick={() => {
            requestExit()
          }}
        >
```

시트 콜백의 이동:

```tsx
        onSelectPhoto={() => {
          dispatch({ type: 'setSource', source: 'photo' })
          setSheet('none')
          goTo('photo')
        }}
```

```tsx
        onSubmit={(quotedText) => {
          dispatch({ type: 'setQuotedText', quotedText })
          setSheet('none')
          goTo('detail')
        }}
```

- [ ] **Step 4: `OcrSelector` 수정**

`latestRef`가 들고 있던 `router`를 `goBack`으로 바꾼다.

```tsx
const { goBack, goTo } = useTraceNav()
const latestRef = useRef({ goBack, ocrMutateAsync, takePhoto })
useEffect(() => {
  latestRef.current = { goBack, ocrMutateAsync, takePhoto }
})
```

촬영 취소:

```tsx
if (!photo) {
  // 첫 진입에서 촬영을 취소하면 보여줄 사진이 없다. 다시 찍기 취소는 기존 사진을 유지한다.
  if (isInitial) latestRef.current.goBack()
  return
}
```

시트 닫기·제출:

```tsx
        onClose={() => {
          goBack()
        }}
```

```tsx
        onSubmit={() => {
          dispatch({ type: 'setQuotedText', quotedText })
          goTo('detail')
        }}
```

- [ ] **Step 5: `TraceDetailForm` · `TraceDecorateForm` · `TraceOpinionForm` 수정**

세 파일 모두 `import { useRouter } from 'next/navigation'`과 `const router = useRouter()`를 지우고 아래로 바꾼다.

```tsx
import { useTraceNav } from '../../_hooks/useTraceNav'
```

```tsx
const { goBack, goTo } = useTraceNav()
```

그리고 각 파일에서 다음을 바꾼다.

**`TraceDetailForm.tsx`** — 하단 버튼 두 개

```tsx
        <Button
          variant="back"
          className="flex-1"
          onClick={() => {
            goBack()
          }}
        >
          뒤로
        </Button>
        <Button
          variant="activated"
          className="flex-1"
          disabled={!isValidPage}
          onClick={() => {
            dispatch({ type: 'setPageDetail', pageNumber, isSpoiler: spoiler === 'yes' })
            goTo('decorate')
          }}
        >
          다음
        </Button>
```

**`TraceDecorateForm.tsx`** — `goToOpinion`과 하단 "뒤로", 그리고 병합 다이얼로그 등록

```tsx
const goToOpinion = () => {
  goTo('opinion')
}
```

```tsx
<Button
  variant="back"
  className="h-[54px] flex-1"
  onClick={() => {
    goBack()
  }}
>
  뒤로
</Button>
```

`candidate` state 선언 바로 아래에 추가한다. import도 함께 더한다(`import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'`).

```tsx
// 병합 다이얼로그가 떠 있으면 뒤로가기가 다이얼로그만 닫는다
useOverlayBackGuard(candidate !== null, () => {
  setCandidate(null)
})
```

**`TraceOpinionForm.tsx`** — 저장 성공 이동과 하단 "뒤로"

```tsx
router.replace('/trace/new/done')
```

를

```tsx
goTo('done')
```

로, 하단 버튼을

```tsx
<Button
  variant="back"
  className="flex-1"
  onClick={() => {
    goBack()
  }}
>
  뒤로
</Button>
```

로 바꾼다.

- [ ] **Step 6: `TraceDoneView` 수정**

```tsx
const { goTo } = useTraceNav()
const router = useRouter()
```

```tsx
            onClick={() => {
              // 홈으로 나가도 초안을 비운다. 남겨두면 다시 들어왔을 때 완료 화면으로 튕긴다.
              dispatch({ type: 'reset' })
              router.replace('/')
            }}
```

```tsx
            onClick={() => {
              dispatch({ type: 'resetKeepingBook' })
              goTo('search')
            }}
```

- [ ] **Step 7: `TraceStepHeader` 수정**

```tsx
'use client'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'

import { useTraceNav } from '../../_hooks/useTraceNav'

type TraceStepHeaderProps = {
  step: 1 | 2 | 3
  title: string
}

export function TraceStepHeader({ step, title }: TraceStepHeaderProps) {
  const { requestExit } = useTraceNav()

  return (
    <div className="flex flex-col">
      {/* 노치 인셋은 레이아웃 셸이 이미 소비했다 — 여기서 다시 더하면 두 번 내려간다 */}
      <TopBar.Root>
        <TopBar.Title>{step}/3</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action
          aria-label="닫기"
          onClick={() => {
            requestExit()
          }}
        >
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>
      <div className="flex items-center px-4 py-2.5">
        <h1 className="min-w-px flex-1 whitespace-pre-line text-title-20bd text-text-primary">
          {title}
        </h1>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: 플로우 진입이 여전히 push인지 확인**

`app/_global/_components/TabScreenLayout/TabScreenLayout.tsx:44`의 `router.push(TRACE_CREATE_PATH)`는 **그대로 둔다**. 플로우 진입만 히스토리를 늘려야 한다.

Run: `rg -n "router\.(push|back)" app/trace/new`
Expected: `TraceDoneView`의 `replace`를 제외하고 `push`·`back` 호출이 남아 있지 않다.

- [ ] **Step 9: 테스트 통과 확인**

Run: `pnpm vitest run app/trace/new`
Expected: PASS (기존 스펙 + 신규 4 tests)

- [ ] **Step 10: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add app/trace/new
git commit -m "fix: 흔적 작성 단계 이동을 replace로 통일한다"
```

---

### Task 7: Android 하드웨어 back 인터셉트

**Files:**

- Modify: `package.json` (`@capacitor/app` 추가)
- Create: `app/trace/new/_hooks/useHardwareBack.ts`
- Modify: `app/trace/new/_components/TraceNavProvider/TraceNavProvider.tsx`
- Modify: `docs/capacitor.md`

**Interfaces:**

- Consumes: `requestExit` (Task 5)
- Produces: `useHardwareBack(onBack: () => void): void`

- [ ] **Step 1: 의존성 추가**

```bash
pnpm add @capacitor/app
npx cap sync
```

`npx cap sync`가 `ios/`·`android/` 프로젝트에 플러그인을 등록한다. `ios/`가 없으면 이 단계는 Android만 갱신되며 정상이다.

- [ ] **Step 2: 훅 작성**

`app/trace/new/_hooks/useHardwareBack.ts`

```ts
'use client'

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef } from 'react'

/**
 * Android 하드웨어 back을 가로챈다. 기본 동작은 웹뷰 히스토리를 되감는 것이라,
 * 가로채지 않으면 작성 중이던 흔적이 확인 없이 사라진다.
 * 네이티브가 아닌 환경(브라우저)에서는 리스너를 붙이지 않는다 — 스택이 2칸이라
 * 브라우저 back이 그대로 홈으로 나가는 것이 기대 동작과 같다.
 */
export function useHardwareBack(onBack: () => void): void {
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  })

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return

    const handle = App.addListener('backButton', () => {
      onBackRef.current()
    })

    return () => {
      void handle.then((listener) => {
        listener.remove()
      })
    }
  }, [])
}
```

- [ ] **Step 3: Provider에 배선**

`TraceNavProvider.tsx`의 `requestExit` 정의 **아래**에 추가한다.

```tsx
// 하드웨어 back도 X 버튼과 같은 판정을 거친다
useHardwareBack(requestExit)
```

import 추가:

```tsx
import { useHardwareBack } from '../../_hooks/useHardwareBack'
```

- [ ] **Step 4: 웹 환경 테스트가 깨지지 않는지 확인**

Run: `pnpm vitest run app/trace/new`
Expected: PASS. `Capacitor.isNativePlatform()`이 happy-dom에서 `false`라 리스너를 붙지 않는다. 실패하면 `vitest.setup.ts`에 모킹을 추가하지 말고, 먼저 실패 메시지를 확인해 `@capacitor/app`의 import 자체가 문제인지 판단한다.

- [ ] **Step 5: 문서 갱신**

`docs/capacitor.md`의 플러그인 목록·재설치 안내 부분에 다음 내용을 추가한다.

```markdown
- `@capacitor/app` — Android 하드웨어 back 인터셉트(흔적 작성 이탈 확인). 추가 후 `npx cap sync`와 앱 재설치가 필요하다. 웹 브라우저에서는 리스너가 붙지 않는다.
```

- [ ] **Step 6: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add package.json pnpm-lock.yaml app/trace/new/_hooks/useHardwareBack.ts app/trace/new/_components/TraceNavProvider/TraceNavProvider.tsx docs/capacitor.md android
git commit -m "fix: Android 하드웨어 back을 흔적 작성 이탈 판정으로 보낸다"
```

---

### Task 8: 실기기 검증과 마무리

**Files:**

- 없음 (검증 전용)

**Interfaces:**

- Consumes: Task 1~7 전부
- Produces: 없음

- [ ] **Step 1: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 전부 PASS

- [ ] **Step 2: 프로덕션 빌드로 웹 확인**

```bash
pnpm build && pnpm start
```

브라우저에서 확인할 것:

1. 홈 → 흔적 남기기 → 책 선택 → 직접 입력 → 대목 저장 → 페이지 입력 → 꾸미기 → 의견 → 저장
2. 각 화면의 "뒤로"가 한 단계씩 되돌아간다 (상세 → 책 검색에서는 방식 선택 시트가 열린다)
3. 브라우저 back을 누르면 어느 단계에서든 홈으로 나간다
4. 작성 중 X를 누르면 확인 다이얼로그가 뜨고, "이어서 쓸게요"로 되돌아온다
5. 완료 화면에서 "흔적 남기기" → 상단 뒤로 화살표를 눌렀을 때 제자리에 머물지 않는다

- [ ] **Step 3: Android 실기기/에뮬레이터 확인**

```bash
pnpm cap:dev:android
```

확인할 것: 시트가 열린 상태의 하드웨어 back은 시트만 닫고, 작성 중 하드웨어 back은 확인 다이얼로그를 띄우며, done에서는 바로 홈으로 나간다.

> `docs/capacitor.md`를 먼저 읽을 것. JDK 21이 필요하고 dev 서버 로드는 프로덕션 빌드(`pnpm build && pnpm start`)로 해야 WKWebView 하이드레이션 문제를 피한다.

- [ ] **Step 4: PR 생성**

`.agents/pr-workflow.md`를 읽고 절차를 따른다. base는 `develop`, 제목은 `흔적 작성 뒤로가기 재설계 (#94)`, 본문에 `Closes #94`.

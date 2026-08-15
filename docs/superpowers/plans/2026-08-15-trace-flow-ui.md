# 흔적 남기기 플로우·UI 개편 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 흔적 작성 플로우에서 책 선택을 첫 단계에서 마지막 단계로 내리고, 사용자에게 보이는 단계를 `① 생각 작성 → ② 문장 꾸미기 → ③ 책 등록하기` 셋으로 재편한다.

**Architecture:** route 하나 = 화면 하나 구조를 유지한 채 스텝 정의(`traceStepNav.service`)와 단계 가드(`traceGuard.service`)를 새 순서로 갈아끼운다. 화면은 기존 컴포넌트를 재배치·합체하고, 저장(`createOpinion`)과 유사 대목 검사(`similar-check`)는 마지막 단계로 옮긴다. 상태 그릇(`TraceDraft`)과 API는 그대로 두고 채워지는 순서만 바꾼다.

**Tech Stack:** Next.js App Router (`app/(app)/trace/new`), React Context + useReducer, TanStack Query, base-ui(BottomSheet/Dialog), Tailwind v4, Vitest + Testing Library

**설계 문서:** `docs/superpowers/specs/2026-08-15-trace-flow-ui-design.md`

## Global Constraints

- 스텝 순서 자체가 바뀌므로 **Task 1~9 중간 상태에서는 플로우가 끝까지 동작하지 않는다.** 각 태스크는 자기 테스트로만 검증하고, 플로우 전체는 Task 10에서 잠근다.
- 코드 변경 후 반드시 `pnpm lint && pnpm typecheck && pnpm test`로 검증한다.
- **default export 금지**(Next 특수 파일 `page.tsx`/`layout.tsx` 예외), **배럴 파일 금지**, 컴포넌트 파일 하나에 컴포넌트 하나.
- 같은 route 내부는 상대경로, `_shared`/`_global`은 `@/` 절대경로. feature 코드에서 `_apis` 직접 import 금지 — `@/app/_global/_queries` 경유.
- 컴포넌트 폴더/파일은 `PascalCase`, 일반 TS 파일은 `camelCase`, 역할 접미사(`.service.ts` `.spec.ts` `.type.ts` …) 유지.
- **모션**: duration·easing은 `globals.css` 토큰만 사용(`duration-instant|fast|normal|slow`, `ease-enter|exit|standard`). 임의값 금지 — `motionConvention.spec.ts`가 막는다. 반복 애니메이션은 `animate-spin`/`animate-pulse`만.
- **모달·바텀시트를 새로 만들지 않는다.** `_components/BottomSheet`·`_components/Dialog`를 쓴다.
- **Safe area**: 화면에서 `env(safe-area-inset-*)`를 직접 쓰지 않는다. 상단은 셸이 `pt-(--safe-top)`으로 소비하고, 풀블리드 화면만 `-mt-(--safe-top)`으로 되돌린 뒤 안에서 다시 더한다. 하단은 `pb-safe`.
- **커밋 메시지 subject는 소문자 또는 한글로 시작한다.** commitlint `subject-case` 규칙이 영문 고유명사로 시작하는 subject를 거부한다(예: `chore: Claude Code …` ✗ / `chore: 워크트리 …` ✓).
- 테스트 파일은 `app/(app)/trace/new/_tests/` 아래. 경로에 괄호가 있어 셸에서는 반드시 따옴표로 감싼다.

---

### Task 1: 스텝 정의와 경로 재편

스텝 이름·경로·뒤로가기·프리페치를 새 순서로 바꾸고 route 폴더를 옮긴다. **가드 조건은 이 태스크에서 건드리지 않는다**(화면이 아직 옛 순서라 조이면 플로우가 막힌다). 경로 문자열만 새 이름에 맞춘다.

**Files:**

- Modify: `app/(app)/trace/new/_services/traceStepNav.service.ts`
- Modify: `app/(app)/trace/new/_services/traceGuard.service.ts` (경로 문자열만)
- Rename: `app/(app)/trace/new/detail/` → `app/(app)/trace/new/write/`
- Rename: `app/(app)/trace/new/opinion/` → `app/(app)/trace/new/book/`
- Modify: `app/(app)/trace/new/_components/OcrSelector/OcrSelector.tsx:226` (`goTo('detail')` → `goTo('write')`)
- Modify: `app/(app)/trace/new/_components/BookPicker/BookPicker.tsx:151` (`goTo('detail')` → `goTo('write')`)
- Modify: `app/(app)/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx:83` (`goTo('opinion')` → `goTo('book')`)
- Test: `app/(app)/trace/new/_tests/traceStepNav.spec.ts`
- Test: `app/(app)/trace/new/_tests/traceGuard.spec.ts` (경로 문자열만)
- Test: `app/(app)/trace/new/_tests/traceStepNavigation.spec.tsx` (경로 문자열만)

**Interfaces:**

- Produces: `type TraceStep = 'book' | 'decorate' | 'done' | 'photo' | 'source' | 'write'`, `stepPath(step)`, `nextStepPaths(step)`, `resolveStep(pathname)`, `resolveBackTarget(step)` — 이후 모든 태스크가 이 이름을 쓴다.

- [ ] **Step 1: `traceStepNav.spec.ts`를 새 스텝으로 다시 쓴다**

```ts
import { describe, expect, it } from 'vitest'

import {
  nextStepPaths,
  resolveBackTarget,
  resolveStep,
  stepPath,
} from '../_services/traceStepNav.service'

describe('resolveStep', () => {
  it('경로를 단계로 바꾼다', () => {
    expect(resolveStep('/trace/new')).toBe('source')
    expect(resolveStep('/trace/new/photo')).toBe('photo')
    expect(resolveStep('/trace/new/write')).toBe('write')
    expect(resolveStep('/trace/new/decorate')).toBe('decorate')
    expect(resolveStep('/trace/new/book')).toBe('book')
    expect(resolveStep('/trace/new/done')).toBe('done')
  })

  it('플로우 밖 경로는 null이다', () => {
    expect(resolveStep('/')).toBeNull()
    expect(resolveStep('/trace/12')).toBeNull()
  })
})

describe('stepPath', () => {
  it('단계를 경로로 바꾼다', () => {
    expect(stepPath('source')).toBe('/trace/new')
    expect(stepPath('book')).toBe('/trace/new/book')
  })
})

describe('nextStepPaths', () => {
  it('각 단계에서 이어질 다음 단계 경로를 준다 — 프리페치 대상', () => {
    expect(nextStepPaths('photo')).toEqual(['/trace/new/write'])
    expect(nextStepPaths('write')).toEqual(['/trace/new/decorate'])
    expect(nextStepPaths('decorate')).toEqual(['/trace/new/book'])
    expect(nextStepPaths('book')).toEqual(['/trace/new/done'])
  })

  it('첫 화면은 방식 선택에 따라 사진·직접입력 어느 쪽으로도 가므로 둘 다 미리 받는다', () => {
    expect(nextStepPaths('source')).toEqual(['/trace/new/photo', '/trace/new/write'])
  })
})

describe('resolveBackTarget', () => {
  it('사진·생각 작성에서 뒤로 가면 대목을 비우고 방식 선택으로 돌아간다', () => {
    expect(resolveBackTarget('photo')).toEqual({ clearQuote: true, step: 'source', type: 'step' })
    expect(resolveBackTarget('write')).toEqual({ clearQuote: true, step: 'source', type: 'step' })
  })

  it('꾸미기·책 등록에서 뒤로 가면 대목을 유지한 채 한 단계만 되돌린다', () => {
    expect(resolveBackTarget('decorate')).toEqual({
      clearQuote: false,
      step: 'write',
      type: 'step',
    })
    expect(resolveBackTarget('book')).toEqual({
      clearQuote: false,
      step: 'decorate',
      type: 'step',
    })
  })

  it('첫 화면과 완료 화면에서 뒤로 가면 플로우를 벗어난다', () => {
    expect(resolveBackTarget('source')).toEqual({ type: 'exit' })
    expect(resolveBackTarget('done')).toEqual({ type: 'exit' })
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- traceStepNav`
Expected: FAIL — `resolveStep('/trace/new')`가 `'search'`를 돌려준다

- [ ] **Step 3: `traceStepNav.service.ts` 교체**

```ts
export type TraceStep = 'book' | 'decorate' | 'done' | 'photo' | 'source' | 'write'

/** 뒤로가기가 향할 곳. exit는 플로우 자체를 벗어나는 것이라 이탈 판정을 한 번 더 거친다. */
export type TraceBackTarget =
  { clearQuote: boolean; step: TraceStep; type: 'step' } | { type: 'exit' }

const START = '/trace/new'

const STEP_PATH: Record<TraceStep, string> = {
  book: `${START}/book`,
  decorate: `${START}/decorate`,
  done: `${START}/done`,
  photo: `${START}/photo`,
  source: START,
  write: `${START}/write`,
}

const STEPS = Object.keys(STEP_PATH) as TraceStep[]

export function stepPath(step: TraceStep): string {
  return STEP_PATH[step]
}

/**
 * 각 단계에서 이어질 다음 단계(들). 미리 route를 프리페치해 '다음'을 눌렀을 때의
 * RSC 왕복을 없앤다. 이 왕복이 웹뷰(원격 URL)에서 단계 전환마다 버벅이는 원인이다.
 * source는 방식 선택에 따라 photo·write 어느 쪽으로도 가므로 둘 다 미리 받는다.
 */
const NEXT_STEPS: Record<TraceStep, TraceStep[]> = {
  source: ['photo', 'write'],
  photo: ['write'],
  write: ['decorate'],
  decorate: ['book'],
  book: ['done'],
  done: ['source'],
}

export function nextStepPaths(step: TraceStep): string[] {
  return NEXT_STEPS[step].map(stepPath)
}

export function resolveStep(pathname: string): TraceStep | null {
  return STEPS.find((step) => STEP_PATH[step] === pathname) ?? null
}

export function resolveBackTarget(step: TraceStep): TraceBackTarget {
  switch (step) {
    // 대목은 사진·직접입력 어느 쪽으로 얻었든 다시 받아야 한다. photo로 되돌리면 카메라가 다시 열린다.
    case 'photo':
    case 'write':
      return { clearQuote: true, step: 'source', type: 'step' }
    case 'decorate':
      return { clearQuote: false, step: 'write', type: 'step' }
    case 'book':
      return { clearQuote: false, step: 'decorate', type: 'step' }
    case 'done':
    case 'source':
      return { type: 'exit' }
  }
}
```

- [ ] **Step 4: route 폴더를 옮긴다**

```bash
git mv "app/(app)/trace/new/detail" "app/(app)/trace/new/write"
git mv "app/(app)/trace/new/opinion" "app/(app)/trace/new/book"
```

`write/page.tsx`와 `book/page.tsx`의 함수 이름을 경로에 맞춘다(`TraceDetailPage` → `TraceWritePage`, `TraceOpinionPage` → `TraceBookPage`). import 대상 컴포넌트는 아직 그대로다.

- [ ] **Step 5: `goTo` 대상과 가드·테스트의 경로 문자열을 새 이름으로 바꾼다**

`OcrSelector.tsx`·`BookPicker.tsx`의 `goTo('detail')` → `goTo('write')`, `TraceDecorateForm.tsx`의 `goTo('opinion')` → `goTo('book')`.
`traceGuard.service.ts`에서 `${START}/detail` → `${START}/write`, `${START}/opinion` → `${START}/book`(조건은 그대로).
`traceGuard.spec.ts`·`traceStepNavigation.spec.tsx`의 경로 문자열도 같이 바꾼다.

- [ ] **Step 6: 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 전부 PASS

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "refactor: 흔적 작성 스텝을 source·photo·write·decorate·book·done으로 재편"
```

---

### Task 2: BottomSheet 확장

책 검색 시트가 요구하는 **전체 높이 · 뒤로 헤더 · 하단 고정 영역**을 기존 `BottomSheet`에 prop으로 흡수한다. 기본 동작은 바뀌지 않아야 한다.

**Files:**

- Modify: `app/_global/_components/BottomSheet/BottomSheet.tsx`
- Test: `app/_global/_tests/bottomSheet.spec.tsx` (신규)

**Interfaces:**

- Produces:

```ts
type BottomSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** 화면 상단 여백만 남기고 채운다. 본문이 안에서 스크롤된다. */
  fullHeight?: boolean
  /** 헤더 왼쪽에 뒤로 아이콘을 놓고 제목을 그 옆에 붙인다. 기본 'close'는 지금처럼 오른쪽 닫기(X). */
  leading?: 'back' | 'close'
  /** 본문 아래 고정 영역. 스크롤에 딸려 올라가지 않는다. */
  footer?: ReactNode
}
```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/_global/_tests/bottomSheet.spec.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BottomSheet } from '../_components/BottomSheet/BottomSheet'

describe('BottomSheet', () => {
  it('기본은 닫기 버튼을 보여준다', () => {
    render(
      <BottomSheet open title="직접 입력" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )

    expect(screen.getByRole('button', { name: '닫기' })).toBeTruthy()
  })

  it('leading이 back이면 뒤로 버튼으로 바뀐다', () => {
    render(
      <BottomSheet open title="책 검색" leading="back" onClose={vi.fn()}>
        <p>본문</p>
      </BottomSheet>,
    )

    expect(screen.getByRole('button', { name: '뒤로' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '닫기' })).toBeNull()
  })

  it('footer는 본문 스크롤 영역 바깥에 그린다', () => {
    render(
      <BottomSheet
        open
        title="책 검색"
        fullHeight
        footer={<button>등록하기</button>}
        onClose={vi.fn()}
      >
        <p>본문</p>
      </BottomSheet>,
    )

    const footerButton = screen.getByRole('button', { name: '등록하기' })
    // 스크롤 컨테이너 안에 들어가면 목록과 함께 밀려 올라간다
    expect(footerButton.closest('[data-slot="bottom-sheet-body"]')).toBeNull()
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- bottomSheet`
Expected: FAIL — `leading`·`footer` prop이 없다

- [ ] **Step 3: `BottomSheet.tsx`를 확장한다**

`BaseDialog.Popup`의 className에 `fullHeight && 'h-[calc(100%-40px)]'`를 더하고, 본문을 `data-slot="bottom-sheet-body"`를 단 스크롤 컨테이너로 감싼 뒤 `footer`를 그 바깥에 둔다. 헤더는 `leading === 'back'`이면 `BaseDialog.Close`에 `BackIcon`을 담아 제목 **왼쪽**에 놓고(aria-label `뒤로`), 아니면 지금처럼 제목 오른쪽에 `CloseIcon`(aria-label `닫기`)을 둔다.

```tsx
// Popup className에 추가
;(fullHeight && 'h-[calc(100%-40px)]',
  (
    // 본문/푸터
    <div
      data-slot="bottom-sheet-body"
      className={cn('flex flex-col gap-4 p-4', fullHeight && 'min-h-0 flex-1 overflow-y-auto')}
    >
      {children}
    </div>
  ))
{
  footer && <div className="shrink-0 px-4 pb-2">{footer}</div>
}
```

`pb-safe`는 Popup에 이미 걸려 있으므로 footer에서 다시 더하지 않는다.

- [ ] **Step 4: 통과 확인**

Run: `pnpm test -- bottomSheet`
Expected: PASS

- [ ] **Step 5: 기존 사용처 회귀 확인**

Run: `pnpm test`
Expected: PASS — `TraceSourceSheet`·`ManualQuoteSheet`·`OcrQuoteSheet`를 쓰는 기존 spec이 그대로 통과해야 한다

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 바텀시트에 전체 높이·뒤로 헤더·하단 고정 영역 옵션 추가"
```

---

### Task 3: 씨앗을 책만 나르도록 축소

`TraceSeed`에서 대목(passage)을 걷어낸다.

**Files:**

- Modify: `app/_shared/trace/_data/traceSeed.model.ts`
- Modify: `app/(app)/trace/[id]/_components/TraceCollapseView/TraceCollapseView.tsx`
- Test: `app/(app)/trace/new/_tests/traceSeed.spec.ts`

**Interfaces:**

- Produces: `type TraceSeed = { bookId: number; bookTitle: string; bookCoverImageUrl: string | null }`, `buildTraceSeedHref(seed)`, `parseTraceSeed(params)`

- [ ] **Step 1: `traceSeed.spec.ts`를 새 타입으로 다시 쓴다**

```ts
import { describe, expect, it } from 'vitest'

import { buildTraceSeedHref, parseTraceSeed } from '@/app/_shared/trace/_data/traceSeed.model'

describe('buildTraceSeedHref', () => {
  it('책만 쿼리에 싣는다', () => {
    expect(buildTraceSeedHref({ bookId: 11, bookTitle: '모순', bookCoverImageUrl: null })).toBe(
      '/trace/new?bookId=11&bookTitle=%EB%AA%A8%EC%88%9C',
    )
  })

  it('표지가 있으면 함께 싣는다', () => {
    expect(
      buildTraceSeedHref({
        bookId: 11,
        bookTitle: '모순',
        bookCoverImageUrl: 'https://img.example/1.jpg',
      }),
    ).toContain('bookCover=https%3A%2F%2Fimg.example%2F1.jpg')
  })
})

describe('parseTraceSeed', () => {
  it('책이 갖춰지면 씨앗이 된다', () => {
    expect(parseTraceSeed({ bookId: '11', bookTitle: '모순' })).toEqual({
      bookId: 11,
      bookTitle: '모순',
      bookCoverImageUrl: null,
    })
  })

  it('책이 없으면 씨앗이 성립하지 않는다', () => {
    expect(parseTraceSeed({ bookTitle: '모순' })).toBeNull()
    expect(parseTraceSeed({})).toBeNull()
  })

  it('대목 쿼리가 남아 있어도 무시한다', () => {
    // 예전 링크가 아직 열려 있을 수 있다. 대목은 이제 항상 새로 입력한다.
    expect(
      parseTraceSeed({ bookId: '11', bookTitle: '모순', quote: '옛 대목', page: '3' }),
    ).toEqual({ bookId: 11, bookTitle: '모순', bookCoverImageUrl: null })
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- traceSeed`
Expected: FAIL — 결과에 `passage` 키가 남아 있다

- [ ] **Step 3: `traceSeed.model.ts`를 줄인다**

`TraceSeedPassage` 타입과 `PARAM`의 `passageId`·`page`·`quote`·`spoiler`를 지우고, `buildTraceSeedHref`·`parseTraceSeed`에서 대목 처리를 걷어낸다. 파일 상단 주석의 "대목까지 물고 갈 때만 채운다" 설명도 함께 정리한다.

- [ ] **Step 4: 호출부를 고친다**

`TraceCollapseView.tsx`에서 `goCreateTrace(passage)`를 인자 없는 함수로 바꾸고 `buildTraceSeedHref({ bookId, bookTitle: stage.bookTitle, bookCoverImageUrl: stage.bookCoverImageUrl })`로 만든다. **`goCreateTrace` 호출부를 모두 찾아 고친다:**

```bash
grep -rn "goCreateTrace\|addTraceToCurrentPassage" "app/(app)/trace/[id]"
```

대목 단위 진입 버튼(`addTraceToCurrentPassage`)이 남아 있으면 버튼 문구가 "이 대목에…"인지 확인하고, 그렇다면 책 기준 문구로 바꾼다.

- [ ] **Step 5: 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 전부 PASS. `BookPicker`의 씨앗 소비 코드에서 `seed.passage` 참조가 타입 에러로 잡히면 그 분기를 지운다(다음 태스크에서 `BookPicker` 자체가 사라지므로 최소 수정으로 컴파일만 통과시킨다).

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "refactor: 흔적 작성 씨앗이 책만 나르도록 축소"
```

---

### Task 4: 첫 화면을 방식 선택 시트로 교체

`BookPicker`(책 검색)를 걷어내고 `/trace/new`를 방식 선택 시트만 있는 화면으로 만든다.

**Files:**

- Create: `app/(app)/trace/new/_components/TraceSourceView/TraceSourceView.tsx`
- Modify: `app/(app)/trace/new/_components/TraceSourceSheet/TraceSourceSheet.tsx` (책 배지)
- Modify: `app/(app)/trace/new/_components/TraceSeedBoundary/TraceSeedBoundary.tsx`
- Delete: `app/(app)/trace/new/_components/BookPicker/BookPicker.tsx`
- Delete: `app/(app)/trace/new/_tests/bookPicker.spec.tsx`
- Test: `app/(app)/trace/new/_tests/traceSourceView.spec.tsx` (신규)

**Interfaces:**

- Consumes: `TraceSeed`(Task 3), `stepPath`/`TraceStep`(Task 1)
- Produces: `TraceSourceView({ seed }: { seed?: TraceSeed | null })` — `/trace/new`가 렌더하는 유일한 화면

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/(app)/trace/new/_tests/traceSourceView.spec.tsx`

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceSourceView } from '../_components/TraceSourceView/TraceSourceView'

const { navState } = vi.hoisted(() => ({ navState: { pathname: '/trace/new' } }))
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => navState.pathname,
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

function renderView(seed: Parameters<typeof TraceSourceView>[0]['seed'] = null) {
  return render(
    <HardwareBackProvider>
      <TraceDraftProvider>
        <TraceOverlayProvider>
          <TraceNavProvider>
            <TraceSourceView seed={seed} />
          </TraceNavProvider>
        </TraceOverlayProvider>
      </TraceDraftProvider>
    </HardwareBackProvider>,
  )
}

describe('흔적 작성 첫 화면', () => {
  it('진입하면 방식 선택 시트가 열려 있다', async () => {
    replaceMock.mockClear()
    renderView()

    expect(await screen.findByText('새로운 기록을 어떻게 남길까요?')).toBeTruthy()
    expect(screen.getByRole('button', { name: /사진으로 입력/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /직접 입력/ })).toBeTruthy()
  })

  it('책을 물고 들어오면 그 책을 시트에 보여준다', async () => {
    renderView({ bookId: 11, bookTitle: '모순', bookCoverImageUrl: null })

    expect(await screen.findByText('지금 기록을 남기는 책')).toBeTruthy()
    expect(screen.getByText('모순')).toBeTruthy()
  })

  it('책이 없으면 배지를 감춘다', async () => {
    renderView()

    await screen.findByText('새로운 기록을 어떻게 남길까요?')
    expect(screen.queryByText('지금 기록을 남기는 책')).toBeNull()
  })

  it('사진으로 입력을 고르면 카메라 단계로 간다', async () => {
    replaceMock.mockClear()
    renderView()

    fireEvent.click(await screen.findByRole('button', { name: /사진으로 입력/ }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/photo')
    })
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- traceSourceView`
Expected: FAIL — `TraceSourceView`가 없다

- [ ] **Step 3: `TraceSourceSheet`에 책 배지를 붙인다**

props에 `book?: SelectedBook | null`을 더하고, 시트 제목을 시안대로 `새로운 기록을 어떻게 남길까요?`로 바꾼다. 두 카드 위에 배지를 넣는다.

```tsx
{
  book && (
    <div className="flex flex-col gap-2">
      <span className="w-fit rounded-lg bg-bg-surface px-2 py-1 text-body-12md text-text-tertiary">
        지금 기록을 남기는 책
      </span>
      <div className="flex items-center gap-3 rounded-lg bg-bg-surface p-3">
        {book.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
          <img src={book.coverImageUrl} alt="" className="h-12 w-9 rounded-[2px] object-cover" />
        ) : (
          <span className="h-12 w-9 rounded-[2px] bg-bg-gray" />
        )}
        <span className="flex min-w-px flex-col">
          <span className="truncate text-body-14md text-text-secondary">{book.title}</span>
          <span className="truncate text-body-12rg text-text-tertiary">{book.author}</span>
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `TraceSourceView`를 만든다**

`BookPicker`에서 씨앗 소비(`pendingSeedRef` + `useEffect`)와 시트 상태(`'manual' | 'none' | 'source'`) 처리만 가져오고 책 검색·도서 등록 폼은 버린다.

- 마운트 시 시트는 항상 `'source'`로 연다(씨앗 유무와 무관)
- 씨앗이 있으면 `dispatch({ type: 'selectBook', book: { bookId, title, author: '', coverImageUrl, pageCount: null } })`
- 사진 → `setSource('photo')` → `goTo('photo')`
- 직접 입력 → `setSource('manual')` → `ManualQuoteSheet` → 제출 시 `setQuotedText` → `goTo('write')`
- 시트를 닫으면 `requestExit()`
- 배경은 `<div className="flex flex-1 flex-col bg-bg-dark" />` — 시트 뒤가 루트 배경으로 비지 않게 한다

- [ ] **Step 5: `TraceSeedBoundary`가 `TraceSourceView`를 렌더하도록 바꾸고 `BookPicker`를 지운다**

```bash
git rm "app/(app)/trace/new/_components/BookPicker/BookPicker.tsx" "app/(app)/trace/new/_tests/bookPicker.spec.tsx"
```

`BookSearchView`·`BookAddForm`·`BookPickList`·`BookCoverCarousel`·`ExternalBookList`는 **지우지 않는다** — Task 8에서 검색 시트로 옮겨 쓴다.

- [ ] **Step 6: 통과 확인**

Run: `pnpm test -- traceSourceView && pnpm lint && pnpm typecheck`
Expected: 전부 PASS

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 흔적 작성 첫 화면을 방식 선택 시트로 교체"
```

---

### Task 5: OCR 실패 화면에 직접 입력 대안 추가

**Files:**

- Modify: `app/(app)/trace/new/_components/OcrSelector/OcrSelector.tsx`
- Test: `app/(app)/trace/new/_tests/ocrManualFallback.spec.tsx` (신규)

**Interfaces:**

- Consumes: `ManualQuoteSheet`(기존), `goTo('write')`(Task 1)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/(app)/trace/new/_tests/ocrManualFallback.spec.tsx` — 카메라 훅과 OCR mutation을 목으로 막고, `takePhoto`가 실패를 던지게 만들어 실패 화면을 띄운 뒤 "직접 입력하기"가 있는지 본다.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { OcrSelector } from '../_components/OcrSelector/OcrSelector'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/photo',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_hooks/useCamera', () => ({
  useCamera: () => ({
    takePhoto: () => Promise.reject(new Error('카메라 없음')),
  }),
}))

vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({
  ocrPassage: () => Promise.resolve({ data: { blocks: [] } }),
  similarCheckPassage: () => Promise.resolve({ data: { passages: [] } }),
}))

function renderSelector() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <TraceDraftProvider>
          <TraceOverlayProvider>
            <TraceNavProvider>
              <OcrSelector />
            </TraceNavProvider>
          </TraceOverlayProvider>
        </TraceDraftProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

describe('OCR 실패 시 직접 입력', () => {
  it('카메라가 열리지 않으면 직접 입력하기를 함께 제안한다', async () => {
    renderSelector()

    expect(await screen.findByRole('button', { name: '직접 입력하기' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '갤러리에서 선택하기' })).toBeTruthy()
  })

  it('직접 입력으로 대목을 적으면 생각 작성 단계로 간다', async () => {
    replaceMock.mockClear()
    renderSelector()

    fireEvent.click(await screen.findByRole('button', { name: '직접 입력하기' }))
    const textarea = await screen.findByPlaceholderText('문장을 입력해주세요.')
    fireEvent.change(textarea, { target: { value: '어떤 문장' } })
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/write')
    })
  })
})
```

**목 대상 확인:** `passageMutations`가 실제로 부르는 생성 함수 이름을 먼저 확인하고 목 경로를 맞춘다.

```bash
grep -n "import" app/_global/_queries/passage.queries.ts
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- ocrManualFallback`
Expected: FAIL — "직접 입력하기" 버튼이 없다

- [ ] **Step 3: `OcrSelector`에 직접 입력 경로를 붙인다**

- `const [manualOpen, setManualOpen] = useState(false)` 추가
- 실패(`failure`) 화면과 권한 안내(`OcrPermissionNotice`) 아래에 `직접 입력하기` 버튼(`variant="back"`)을 갤러리 버튼과 나란히 배치
- 컴포넌트 끝에 `ManualQuoteSheet`를 얹고, 제출 시 `dispatch({ type: 'setSource', source: 'manual' })` → `dispatch({ type: 'setQuotedText', quotedText })` → `goTo('write')`
- 시트가 열려 있는 동안 뒤로가기가 시트만 닫도록 `useOverlayBackGuard(manualOpen, () => { setManualOpen(false) })`

- [ ] **Step 4: 통과 확인**

Run: `pnpm test -- ocrManualFallback`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: ocr 실패·권한 거부 화면에서 직접 입력으로 이어가기"
```

---

### Task 6: ① 생각 작성 화면

`TraceDetailForm`(페이지·스포일러)과 `TraceOpinionForm`(의견)을 한 화면으로 합치고, 스텝 인디케이터를 새로 만든다. **저장 로직은 아직 옮기지 않는다**(Task 9).

**Files:**

- Create: `app/(app)/trace/new/_components/TraceStepIndicator/TraceStepIndicator.tsx`
- Create: `app/(app)/trace/new/_components/TraceWriteForm/TraceWriteForm.tsx`
- Modify: `app/(app)/trace/new/write/page.tsx`
- Delete: `app/(app)/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx`
- Test: `app/(app)/trace/new/_tests/traceWriteForm.spec.tsx` (신규)

**Interfaces:**

- Produces: `TraceStepIndicator({ current }: { current: 1 | 2 | 3 })`, `TraceWriteForm()`
- 인디케이터 라벨: `1 생각 작성` · `2 문장 꾸미기` · `3 책 등록하기`. 오른쪽 끝에 닫기(X, `requestExit`). 시안에는 기존 `TraceStepHeader`가 달던 **큰 제목이 없다**.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/(app)/trace/new/_tests/traceWriteForm.spec.tsx`

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { TraceWriteForm } from '../_components/TraceWriteForm/TraceWriteForm'
import { useTraceDraft } from '../_hooks/useTraceDraft'

const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/write',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

// 대목을 담아 둔 상태에서 시작해야 실제 진입 조건과 같다.
// dispatch는 반드시 effect에서 부른다 — 렌더 중에 부르면 Provider를 렌더 도중 갱신하게 되어
// "Cannot update a component while rendering a different component" 경고가 난다.
function Seeded() {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    dispatch({ type: 'setQuotedText', quotedText: '어떤 문장' })
  }, [dispatch])

  if (!draft.quotedText) return null
  return <TraceWriteForm />
}

function renderForm() {
  return render(
    <HardwareBackProvider>
      <TraceDraftProvider>
        <TraceOverlayProvider>
          <TraceNavProvider>
            <Seeded />
          </TraceNavProvider>
        </TraceOverlayProvider>
      </TraceDraftProvider>
    </HardwareBackProvider>,
  )
}

describe('생각 작성 단계', () => {
  it('페이지와 의견이 모두 차야 다음으로 넘어갈 수 있다', async () => {
    replaceMock.mockClear()
    renderForm()

    const next = await screen.findByRole('button', { name: '다음' })
    expect(next.hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByLabelText('페이지'), { target: { value: '100' } })
    expect(screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')).toBe(true)

    fireEvent.change(screen.getByPlaceholderText('문장에 대한 생각이나 의견을 작성해보세요.'), {
      target: { value: '좋았다' },
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '다음' }).hasAttribute('disabled')).toBe(false)
    })
  })

  it('다음을 누르면 페이지·스포일러·의견이 함께 남고 꾸미기로 간다', async () => {
    replaceMock.mockClear()
    renderForm()

    fireEvent.change(await screen.findByLabelText('페이지'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('문장에 대한 생각이나 의견을 작성해보세요.'), {
      target: { value: '좋았다' },
    })
    fireEvent.click(screen.getByRole('button', { name: '있어요' }))
    fireEvent.click(screen.getByRole('button', { name: '다음' }))

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/decorate')
    })
  })

  it('책 쪽수와 무관하게 다섯 자리까지 받는다', async () => {
    renderForm()

    const page = await screen.findByLabelText('페이지')
    fireEvent.change(page, { target: { value: '123456789' } })
    expect((page as HTMLInputElement).value).toBe('12345')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- traceWriteForm`
Expected: FAIL — `TraceWriteForm`이 없다

- [ ] **Step 3: `TraceStepIndicator`를 만든다**

```tsx
'use client'

import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { cn } from '@/app/_global/_services/cn.service'

import { useTraceNav } from '../../_hooks/useTraceNav'

const STEP_LABELS = ['생각 작성', '문장 꾸미기', '책 등록하기'] as const

export function TraceStepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const { requestExit } = useTraceNav()

  return (
    <TopBar.Root>
      <ol className="flex min-w-px flex-1 items-center gap-1.5">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1
          const isCurrent = step === current
          return (
            <li key={label} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-text-tertiary">
                  ›
                </span>
              )}
              <span
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-body-12md',
                  isCurrent ? 'bg-bg-inverse text-text-inverse' : 'bg-bg-gray text-text-tertiary',
                )}
              >
                {step}
              </span>
              <span
                className={cn(
                  'text-body-14md',
                  isCurrent ? 'text-text-primary' : 'text-text-tertiary',
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
      <TopBar.Action
        aria-label="닫기"
        onClick={() => {
          requestExit()
        }}
      >
        <CloseIcon />
      </TopBar.Action>
    </TopBar.Root>
  )
}
```

색 토큰 이름은 `globals.css`에 있는 것으로 맞춘다(`bg-bg-inverse`가 없으면 시안에 맞는 기존 토큰을 쓴다).

- [ ] **Step 4: `TraceWriteForm`을 만든다**

`TraceDetailForm`의 구조(흰 상단 + 노트가 밝음/어둠 경계를 가로지르는 레이아웃, `-mt-(--safe-top)` 처리, 페이지 입력, `SegmentedControl`)를 그대로 가져오되:

- 헤더를 `TraceStepIndicator current={1}`로 교체
- 페이지 `input`에 `id`를 주고 `label`과 연결한다(테스트가 `getByLabelText('페이지')`로 찾는다)
- **`maxPage` 상한 검증을 제거한다.** 유효 조건은 `page.length > 0 && Number.isInteger(pageNumber) && pageNumber > 0`
- 아래에 의견 `Textarea`(`variant="dark"`, `maxLength={300}`, placeholder `문장에 대한 생각이나 의견을 작성해보세요.`)를 붙이고 `draft.content`에 직접 반영
- '다음' 비활성: `!isValidPage || draft.content.trim().length === 0`
- '다음' 클릭: `dispatch({ type: 'setPageDetail', pageNumber, isSpoiler: spoiler === 'yes' })` → `goTo('decorate')`

- [ ] **Step 5: `write/page.tsx`를 새 컴포넌트로 바꾸고 옛 폼을 지운다**

```bash
git rm "app/(app)/trace/new/_components/TraceDetailForm/TraceDetailForm.tsx"
```

- [ ] **Step 6: 검증**

Run: `pnpm test -- traceWriteForm && pnpm lint && pnpm typecheck`
Expected: 전부 PASS

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 생각 작성 단계에서 대목·페이지·의견을 한 화면에 받기"
```

---

### Task 7: ② 꾸미기 인터랙션 반전

`드래그 → 효과 탭`을 `효과 탭 → 드래그`로 뒤집는다.

**Files:**

- Modify: `app/(app)/trace/new/_hooks/useTextRangeSelection.ts`
- Modify: `app/(app)/trace/new/_components/EffectPicker/EffectPicker.tsx`
- Modify: `app/(app)/trace/new/_components/EffectPicker/EffectPicker.stories.tsx`
- Modify: `app/(app)/trace/new/_components/TraceDecorateForm/TraceDecorateForm.tsx`
- Test: `app/(app)/trace/new/_tests/decorateEffectFirst.spec.tsx` (신규)

**Interfaces:**

- Produces:

```ts
// useTextRangeSelection.ts — 인자를 객체로 바꾼다(호출부는 TraceDecorateForm 하나뿐)
export function useTextRangeSelection(params: {
  onChange: (range: TextRange) => void
  /** 손을 뗀 시점. 이때 효과를 적용한다. */
  onCommit?: (range: TextRange) => void
  scrollRef?: RefObject<HTMLElement | null>
}): { handlers: { onPointerCancel: …; onPointerDown: …; onPointerMove: …; onPointerUp: … } }

// EffectPicker.tsx
type EffectPickerProps = {
  disabled: boolean
  onPick: (option: EffectOption) => void
  /** 고른 효과. 활성으로 표시한다. */
  selectedKey?: EffectOption['key'] | null
}
```

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/(app)/trace/new/_tests/decorateEffectFirst.spec.tsx` — 포인터 이벤트로 드래그를 흉내 내려면 `document.elementFromPoint`가 오프셋을 돌려줘야 한다. happy-dom에서는 좌표 기반 히트 테스트가 없으므로 목으로 대신한다.

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceDecorateForm } from '../_components/TraceDecorateForm/TraceDecorateForm'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/decorate',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

const QUOTE = '어떤 문장'

// dispatch는 effect에서만 부른다(렌더 중 부르면 Provider를 렌더 도중 갱신하게 된다)
function Seeded({ onDraft }: { onDraft: (count: number) => void }) {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    dispatch({ type: 'setQuotedText', quotedText: QUOTE })
    dispatch({ type: 'setPageDetail', pageNumber: 10, isSpoiler: false })
    dispatch({ type: 'setContent', content: '좋았다' })
  }, [dispatch])

  onDraft(draft.decorations.length)
  if (!draft.quotedText) return null
  return <TraceDecorateForm />
}

/** 글자 span 위를 끄는 시늉. elementFromPoint가 오프셋 span을 돌려주게 한다. */
function dragOver(from: number, to: number) {
  const charAt = (offset: number) => document.querySelector(`[data-offset="${String(offset)}"]`)
  const note = document.querySelector('p')
  if (!note) throw new Error('노트를 찾지 못했다')

  vi.spyOn(document, 'elementFromPoint').mockImplementation(() => charAt(from) as Element)
  fireEvent.pointerDown(note, { clientX: 1, clientY: 1, pointerId: 1 })
  vi.spyOn(document, 'elementFromPoint').mockImplementation(() => charAt(to) as Element)
  fireEvent.pointerMove(note, { clientX: 2, clientY: 1, pointerId: 1 })
  fireEvent.pointerUp(note, { pointerId: 1 })
}

function renderForm(onDraft: (count: number) => void) {
  return render(
    <HardwareBackProvider>
      <TraceDraftProvider>
        <TraceOverlayProvider>
          <TraceNavProvider>
            <Seeded onDraft={onDraft} />
          </TraceNavProvider>
        </TraceOverlayProvider>
      </TraceDraftProvider>
    </HardwareBackProvider>,
  )
}

describe('효과를 먼저 고르고 드래그하기', () => {
  beforeEach(() => {
    // setPointerCapture는 happy-dom에 없다
    Element.prototype.setPointerCapture = vi.fn()
  })

  it('효과를 고르지 않고 끌면 아무 효과도 들어가지 않는다', async () => {
    let count = -1
    renderForm((next) => {
      count = next
    })

    await screen.findByRole('button', { name: /형광펜/ })
    dragOver(0, 2)

    expect(count).toBe(0)
    expect(screen.getByText(/효과를 먼저 선택/)).toBeTruthy()
  })

  it('효과를 고른 뒤 끌면 손을 떼는 순간 그 효과가 들어간다', async () => {
    let count = -1
    renderForm((next) => {
      count = next
    })

    fireEvent.click(await screen.findByRole('button', { name: /형광펜/ }))
    dragOver(0, 2)

    expect(count).toBe(1)
  })

  it('효과는 적용 후에도 골라진 채 남아 연속으로 칠할 수 있다', async () => {
    let count = -1
    renderForm((next) => {
      count = next
    })

    fireEvent.click(await screen.findByRole('button', { name: /형광펜/ }))
    dragOver(0, 1)
    dragOver(3, 4)

    expect(count).toBe(2)
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- decorateEffectFirst`
Expected: FAIL — 효과 없이 끌어도 스낵바가 뜨지 않고, 효과를 골라도 드래그로는 적용되지 않는다

- [ ] **Step 3: `useTextRangeSelection`에 커밋 콜백을 넣는다**

인자를 객체로 바꾸고, 마지막 범위를 ref에 들고 있다가 `onPointerUp`에서 넘긴다.

```ts
const lastRangeRef = useRef<TextRange | null>(null)

// onPointerDown / onPointerMove 안에서 onChange 호출 직전에
lastRangeRef.current = range

const onPointerUp = () => {
  const committed = anchorRef.current !== null ? lastRangeRef.current : null
  anchorRef.current = null
  pointerRef.current = null
  lastRangeRef.current = null
  stopAutoScroll()
  if (committed) onCommitRef.current?.(committed)
}
```

`onChange`와 같은 방식으로 `onCommit`도 ref에 최신값을 담아 rAF 루프와 충돌하지 않게 한다. `onPointerCancel`은 커밋 없이 리셋한다.

- [ ] **Step 4: `EffectPicker`에 선택 표시를 넣는다**

`selectedKey`가 같은 버튼에 `aria-pressed`와 활성 스타일(`bg-bg-default text-text-primary` — 지금 `active:` 상태와 같은 반전)을 준다. `EffectPicker.stories.tsx`에도 선택 상태 스토리를 하나 더한다.

- [ ] **Step 5: `TraceDecorateForm`을 반전한다**

- `const [activeEffect, setActiveEffect] = useState<EffectOption | null>(null)`
- `handlePick`은 이제 적용이 아니라 **선택**이다: `setActiveEffect(option)`
- `useTextRangeSelection({ onChange: setRange, onCommit: handleCommit, scrollRef })`
- `handleCommit(range)`:

```ts
const handleCommit = (committed: TextRange) => {
  if (!activeEffect) {
    setRange(null)
    setMessage(EFFECT_HINT_MESSAGE)
    return
  }
  dispatch({
    type: 'applyDecoration',
    decoration: {
      ...committed,
      effectType: activeEffect.effectType,
      color: DEFAULT_DECORATION_COLOR,
    },
  })
  setRange(null)
}
```

- 스낵바 문구를 뒤집는다: `const EFFECT_HINT = '효과를 먼저 선택'`, `const EFFECT_HINT_MESSAGE = `${EFFECT_HINT}한 뒤 문장을 드래그해주세요!``
- 헤더를 `TraceStepIndicator current={2}`로 교체하고, 안내 문구는 "적용할 효과를 고르고 문장을 드래그해보세요"로 바꾼다
- **`similar-check`(`useMutation(passageMutations.similarCheck())`)와 `MergeDialog`를 이 파일에서 걷어낸다.** '다음'은 곧장 `goTo('book')`. 병합은 Task 9에서 `TraceBookForm`이 맡는다
- 드래그 중 미리보기는 지금의 `pendingRange` 하이라이트를 그대로 둔다(효과 모양 미리보기는 겹침 처리까지 건드려야 해 범위를 넘는다)

- [ ] **Step 6: 통과 확인**

Run: `pnpm test -- decorateEffectFirst && pnpm test -- decorationEditPopoverTransition`
Expected: 전부 PASS — 기존 편집 팝오버 동작이 깨지지 않아야 한다

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 꾸미기를 효과 선택 후 드래그 방식으로 반전"
```

---

### Task 8: ③ 책 검색 시트

`BookSearchView`를 시트 본문으로 옮기고, **선택이 즉시 확정되지 않고 하단 '등록하기'로 확정되도록** 바꾼다.

**Files:**

- Create: `app/(app)/trace/new/_components/BookSearchSheet/BookSearchSheet.tsx`
- Modify: `app/(app)/trace/new/_components/BookSearchView/BookSearchView.tsx`
- Test: `app/(app)/trace/new/_tests/bookSearchSheet.spec.tsx` (신규)

**Interfaces:**

- Consumes: `BottomSheet`의 `fullHeight`/`leading`/`footer`(Task 2)
- Produces:

```ts
type BookSearchSheetProps = {
  open: boolean
  onClose: () => void
  onSelect: (book: SelectedBook) => void
}
```

`BookSearchView`는 화면 껍데기(`main`·`TopBar`·safe-area) 없이 본문만 렌더하도록 바꾸고, props에서 `onBack`을 빼고 `selectedBookId`·`onPick`을 받는다(확정은 시트가 한다).

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/(app)/trace/new/_tests/bookSearchSheet.spec.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BookSearchSheet } from '../_components/BookSearchSheet/BookSearchSheet'

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  createBook: () => Promise.resolve(null),
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () =>
    Promise.resolve({
      data: {
        books: [
          { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: 300 },
        ],
      },
    }),
  searchExternalBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: () =>
    Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

function renderSheet(onSelect = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <BookSearchSheet open onClose={vi.fn()} onSelect={onSelect} />
    </QueryClientProvider>,
  )
  return onSelect
}

describe('책 검색 시트', () => {
  it('시트 안에서 뒤로 버튼과 검색창을 보여준다', async () => {
    renderSheet()

    expect(await screen.findByRole('button', { name: '뒤로' })).toBeTruthy()
    expect(screen.getByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('책을 고르는 것만으로는 확정되지 않는다', async () => {
    const onSelect = renderSheet()

    fireEvent.click(await screen.findByText('모순'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('고른 뒤 등록하기를 눌러야 확정된다', async () => {
    const onSelect = renderSheet()

    fireEvent.click(await screen.findByText('모순'))
    fireEvent.click(screen.getByRole('button', { name: '등록하기' }))

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ bookId: 7, title: '모순' }))
  })

  it('아무것도 고르지 않으면 등록하기가 눌리지 않는다', async () => {
    renderSheet()

    await screen.findByPlaceholderText('책 제목을 입력해 주세요.')
    expect(screen.getByRole('button', { name: '등록하기' }).hasAttribute('disabled')).toBe(true)
  })
})
```

**목 대상 확인:** `book.queries.ts`·`user.queries.ts`가 실제로 부르는 생성 함수 이름을 먼저 확인해 목 경로를 맞춘다.

```bash
grep -n "import" app/_global/_queries/book.queries.ts app/_global/_queries/user.queries.ts
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- bookSearchSheet`
Expected: FAIL — `BookSearchSheet`가 없다

- [ ] **Step 3: `BookSearchView`를 시트 본문으로 바꾼다**

- 바깥 `<main>`과 `TopBar` 블록을 지우고 `<>…</>`로 감싼 본문(`BookSearchBar` + 스크롤 영역)만 남긴다. 시트가 이미 자기 높이·스크롤을 갖는다
- props: `onBack` 제거, `selectedBookId: number | null`과 `onPick: (book: SelectedBook) => void` 추가. 내부에서 `onSelect` 호출부를 `onPick`으로 바꾼다
- 목록·캐러셀에서 지금 고른 책을 표시할 수 있도록 `selectedBookId`를 `BookPickList`·`BookCoverCarousel`에 내려 선택 테두리를 준다. 두 컴포넌트가 선택 표시를 지원하지 않으면 각 파일에 `selectedBookId?: number | null` prop을 더해 `aria-pressed`와 테두리(`ring-2 ring-interactive-accent`)만 붙인다

- [ ] **Step 4: `BookSearchSheet`를 만든다**

```tsx
'use client'

import { useState } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import { Button } from '@/app/_global/_components/Button/Button'

import {
  type BookFormValues,
  emptyBookForm,
  normalizeExternalAuthor,
} from '../../_services/bookForm.service'
import type { SelectedBook } from '../../_types/traceDraft.type'
import { BookAddForm } from '../BookAddForm/BookAddForm'
import { BookSearchView } from '../BookSearchView/BookSearchView'
import type { ExternalBook } from '../ExternalBookList/ExternalBookList'
```

- 내부 state: `picked: SelectedBook | null`, `form: { coverImageUrl: null | string; values: BookFormValues } | null`
- `form`이 있으면 `BookAddForm`을 시트 위에 얹고, 등록되면 `onSelect(book)`로 바로 확정한다(직접 등록한 책은 다시 고를 이유가 없다)
- 시트: `<BottomSheet open={open} title="책 검색" leading="back" fullHeight onClose={onClose} footer={…}>`
- footer: `<Button variant="activated" className="w-full" disabled={!picked} onClick={() => { if (picked) onSelect(picked) }}>등록하기</Button>`
- 본문: `<BookSearchView selectedBookId={picked?.bookId ?? null} onPick={setPicked} onAddManually={…} onSelectExternal={…} />`
- `BookPicker`에 있던 외부 도서(알라딘) → 등록 폼 채우기 로직(`normalizeExternalAuthor`)을 그대로 옮긴다

- [ ] **Step 5: 통과 확인**

Run: `pnpm test -- bookSearchSheet && pnpm lint && pnpm typecheck`
Expected: 전부 PASS

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: 책 검색을 바텀시트로 옮기고 등록하기로 확정하게 변경"
```

---

### Task 9: ③ 확인 화면과 저장

책을 고르고, 병합을 판정하고, 최종 확인 후 저장한다. 이 태스크가 끝나면 플로우가 처음부터 끝까지 이어진다.

**Files:**

- Create: `app/(app)/trace/new/_components/TraceBookForm/TraceBookForm.tsx`
- Create: `app/(app)/trace/new/_components/TraceOpinionPreview/TraceOpinionPreview.tsx`
- Modify: `app/(app)/trace/new/book/page.tsx`
- Delete: `app/(app)/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx`
- Test: `app/(app)/trace/new/_tests/traceBookForm.spec.tsx` (신규)

**Interfaces:**

- Consumes: `BookSearchSheet`(Task 8), `MergeDialog`(기존), `TraceStepIndicator`(Task 6), `opinionMutations.create()`·`passageMutations.similarCheck()`(기존 queries)
- Produces: `TraceBookForm()`, `TraceOpinionPreview({ content }: { content: string })`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`app/(app)/trace/new/_tests/traceBookForm.spec.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HardwareBackProvider } from '@/app/_global/_providers/HardwareBackProvider/HardwareBackProvider'

import { TraceBookForm } from '../_components/TraceBookForm/TraceBookForm'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'
import { useTraceDraft } from '../_hooks/useTraceDraft'

const replaceMock = vi.fn()
const similarCheckMock = vi.fn(() => Promise.resolve({ data: { passages: [] } }))
const createOpinionMock = vi.fn(() => Promise.resolve({ data: { opinionId: 5, merged: false } }))

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new/book',
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, prefetch: vi.fn() }),
}))

vi.mock('@/app/_global/_apis/_generated/passage/passage', () => ({
  ocrPassage: () => Promise.resolve({ data: { blocks: [] } }),
  similarCheckPassage: (...args: unknown[]) => similarCheckMock(...args),
}))

vi.mock('@/app/_global/_apis/_generated/opinion/opinion', () => ({
  createOpinion: (...args: unknown[]) => createOpinionMock(...args),
}))

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  createBook: () => Promise.resolve(null),
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () =>
    Promise.resolve({
      data: {
        books: [
          { bookId: 7, title: '모순', author: '양귀자', coverImageUrl: null, pageCount: 300 },
        ],
      },
    }),
  searchExternalBooks: () => Promise.resolve({ data: { books: [] } }),
  searchInternalBooks: () =>
    Promise.resolve({ data: { books: [], pageInfo: { page: 0, hasNext: false } } }),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMe: () => Promise.resolve({ data: { nickname: '나' } }),
  getMyOpinions: () => Promise.resolve({ data: { opinions: [] } }),
}))

// dispatch는 effect에서만 부른다(렌더 중 부르면 Provider를 렌더 도중 갱신하게 된다)
function Seeded() {
  const { dispatch, draft } = useTraceDraft()

  useEffect(() => {
    dispatch({ type: 'setQuotedText', quotedText: '어떤 문장' })
    dispatch({ type: 'setPageDetail', pageNumber: 10, isSpoiler: false })
    dispatch({ type: 'setContent', content: '좋았다' })
    dispatch({
      type: 'applyDecoration',
      decoration: { startOffset: 0, endOffset: 2, effectType: 'HIGHLIGHT', color: '#FFE81A' },
    })
  }, [dispatch])

  if (!draft.quotedText) return null
  return <TraceBookForm />
}

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <HardwareBackProvider>
        <TraceDraftProvider>
          <TraceOverlayProvider>
            <TraceNavProvider>
              <Seeded />
            </TraceNavProvider>
          </TraceOverlayProvider>
        </TraceDraftProvider>
      </HardwareBackProvider>
    </QueryClientProvider>,
  )
}

async function pickBook() {
  fireEvent.click(await screen.findByText('모순'))
  fireEvent.click(screen.getByRole('button', { name: '등록하기' }))
}

describe('책 등록 단계', () => {
  it('책이 없으면 검색 시트를 열어 둔다', async () => {
    renderForm()

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('책을 고르면 유사 대목 검사를 돌린다', async () => {
    similarCheckMock.mockClear()
    renderForm()
    await pickBook()

    await waitFor(() => {
      expect(similarCheckMock).toHaveBeenCalled()
    })
  })

  it('책을 고르면 확인 화면에 책·의견이 보인다', async () => {
    renderForm()
    await pickBook()

    expect(await screen.findByText('양귀자')).toBeTruthy()
    expect(screen.getByText('좋았다')).toBeTruthy()
  })

  it('책 카드를 누르면 검색 시트가 다시 열린다', async () => {
    renderForm()
    await pickBook()

    fireEvent.click(await screen.findByRole('button', { name: /책 다시 고르기/ }))

    expect(await screen.findByPlaceholderText('책 제목을 입력해 주세요.')).toBeTruthy()
  })

  it('등록하기를 누르면 흔적을 저장하고 완료로 간다', async () => {
    replaceMock.mockClear()
    createOpinionMock.mockClear()
    renderForm()
    await pickBook()

    fireEvent.click(await screen.findByRole('button', { name: '등록하기' }))

    await waitFor(() => {
      expect(createOpinionMock).toHaveBeenCalled()
      expect(replaceMock).toHaveBeenCalledWith('/trace/new/done')
    })
  })
})
```

**목 대상 확인:** `opinion.queries.ts`·`passage.queries.ts`가 실제로 부르는 생성 함수 이름과 경로를 먼저 확인해 목을 맞춘다. 위 코드의 `createOpinion`·`similarCheckPassage`·`ocrPassage`는 추정이다.

```bash
grep -n "import" app/_global/_queries/opinion.queries.ts app/_global/_queries/passage.queries.ts
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- traceBookForm`
Expected: FAIL — `TraceBookForm`이 없다

- [ ] **Step 3: `TraceOpinionPreview`를 만든다**

```tsx
export function TraceOpinionPreview({ content }: { content: string }) {
  return (
    <section className="flex flex-col gap-2 px-8">
      <h2 className="text-body-14md text-text-inverse opacity-60">의견</h2>
      <p className="whitespace-pre-wrap rounded-lg bg-bg-surface/10 p-4 text-body-16rg text-text-inverse">
        {content}
      </p>
    </section>
  )
}
```

- [ ] **Step 4: `TraceBookForm`을 만든다**

- 헤더 `TraceStepIndicator current={3}`
- `const [sheetOpen, setSheetOpen] = useState(draft.book === null)` — 씨앗으로 책이 이미 있으면 열지 않는다
- 확인 화면: 책 카드(버튼, `aria-label="책 다시 고르기"` → `setSheetOpen(true)`) + `TraceNote`(`decorations={draft.decorations}`, 읽기 전용) + `TraceOpinionPreview`
- 책 선택 핸들러:

```ts
const handleSelectBook = (book: SelectedBook) => {
  dispatch({ type: 'selectBook', book })
  setSheetOpen(false)
  similarCheck.mutate(
    { bookId: book.bookId, pageNumber: draft.pageNumber ?? 0, quotedText: draft.quotedText },
    {
      onSuccess: (response) => {
        const first = response.data?.passages[0]
        if (first) setCandidate({ passageId: first.passageId, quotedText: first.quotedText })
      },
      // 유사 검사는 편의 기능이다. 실패해도 등록을 막지 않는다.
      onError: () => {
        setCandidate(null)
      },
    },
  )
}
```

- `MergeDialog`: `onMerge` → `setMergeTarget(candidate.passageId)`, `onSeparate` → `setMergeTarget(null)`. 둘 다 `setCandidate(null)`로 닫는다. 다이얼로그가 떠 있는 동안 뒤로가기는 `useOverlayBackGuard(candidate !== null, …)`로 다이얼로그만 닫는다
- 저장: `TraceOpinionForm.handleSubmit`을 **그대로** 옮긴다 — 페이로드 구성, `setResult` 후 `goTo('done')`, 401 → `runWithLogin(…, LOGIN_GATE_MESSAGE.traceCreate)`, `PASSAGE_400_2`/`PASSAGE_404_1` → `setMergeTarget(null)` + 안내, 그 외 실패 메시지, **draft 보존**
- 페이지 범위를 서버가 거절하는 경우를 대비해 실패 메시지에 페이지 확인 안내를 더한다: `'페이지 번호를 다시 확인해주세요.'`(에러 코드는 실제 응답을 보고 맞춘다. 확인 전에는 기존 일반 메시지로 둔다)
- 하단: `뒤로`(→ `goBack()`) / `등록하기`(`variant="activated"`, `disabled={!draft.book}`, `loading={createOpinion.isPending}`)

- [ ] **Step 5: `book/page.tsx`를 바꾸고 옛 폼을 지운다**

```bash
git rm "app/(app)/trace/new/_components/TraceOpinionForm/TraceOpinionForm.tsx"
```

- [ ] **Step 6: 검증**

Run: `pnpm test -- traceBookForm && pnpm lint && pnpm typecheck`
Expected: 전부 PASS

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 책 등록 단계에서 책 선택·병합 판정·최종 등록 처리"
```

---

### Task 10: 가드 조이기와 마무리

화면이 모두 새 순서로 갖춰졌으니 단계 가드를 새 조건으로 조이고, 남은 참조를 정리한 뒤 플로우 전체를 잠근다.

**Files:**

- Modify: `app/(app)/trace/new/_services/traceGuard.service.ts`
- Delete: `app/(app)/trace/new/_components/TraceStepHeader/TraceStepHeader.tsx`
- Test: `app/(app)/trace/new/_tests/traceGuard.spec.ts`
- Test: `app/(app)/trace/new/_tests/traceStepNavigation.spec.tsx`

- [ ] **Step 1: `traceGuard.spec.ts`를 새 조건으로 다시 쓴다**

```ts
import { describe, expect, it } from 'vitest'

import { initialTraceDraft } from '../_data/traceDraft.store'
import { resolveGuardRedirect } from '../_services/traceGuard.service'
import type { TraceDraft } from '../_types/traceDraft.type'

const draftWith = (overrides: Partial<TraceDraft>): TraceDraft => ({
  ...initialTraceDraft,
  ...overrides,
})

const written = draftWith({ quotedText: '문장', pageNumber: 10, content: '좋았다' })
const decorated = draftWith({
  ...written,
  decorations: [{ startOffset: 0, endOffset: 2, effectType: 'HIGHLIGHT', color: '#FFE81A' }],
})

describe('resolveGuardRedirect', () => {
  it('첫 화면은 언제나 통과한다', () => {
    expect(resolveGuardRedirect('/trace/new', initialTraceDraft)).toBeNull()
  })

  it('카메라 단계는 책 없이도 들어갈 수 있다', () => {
    // 책은 이제 마지막에 고른다. 대목을 얻기 전이라 선행 조건이 없다.
    expect(resolveGuardRedirect('/trace/new/photo', initialTraceDraft)).toBeNull()
  })

  it('대목 없이 생각 작성에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/write', initialTraceDraft)).toBe('/trace/new')
  })

  it('대목이 있으면 생각 작성을 통과한다', () => {
    expect(resolveGuardRedirect('/trace/new/write', draftWith({ quotedText: '문장' }))).toBeNull()
  })

  it('페이지나 의견이 비면 꾸미기에서 생각 작성으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/decorate', draftWith({ quotedText: '문장' }))).toBe(
      '/trace/new/write',
    )
    expect(
      resolveGuardRedirect(
        '/trace/new/decorate',
        draftWith({ quotedText: '문장', pageNumber: 10 }),
      ),
    ).toBe('/trace/new/write')
  })

  it('생각 작성을 마치면 꾸미기를 통과한다', () => {
    expect(resolveGuardRedirect('/trace/new/decorate', written)).toBeNull()
  })

  it('꾸밈 없이 책 등록에 들어오면 꾸미기로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/book', written)).toBe('/trace/new/decorate')
  })

  it('꾸밈까지 마치면 책 등록을 통과한다 — 책은 여기서 고른다', () => {
    expect(resolveGuardRedirect('/trace/new/book', decorated)).toBeNull()
  })

  it('저장이 끝났으면 작성 단계로 되돌아갈 수 없다', () => {
    const saved = draftWith({ ...decorated, result: { opinionId: 1, merged: false } })
    expect(resolveGuardRedirect('/trace/new/decorate', saved)).toBe('/trace/new/done')
    expect(resolveGuardRedirect('/trace/new/done', saved)).toBeNull()
    // 첫 화면은 새 흔적을 시작하는 자리라 막지 않는다
    expect(resolveGuardRedirect('/trace/new', saved)).toBeNull()
  })

  it('결과 없이 완료 화면에 들어오면 시작으로 되돌린다', () => {
    expect(resolveGuardRedirect('/trace/new/done', initialTraceDraft)).toBe('/trace/new')
  })
})
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm test -- traceGuard`
Expected: FAIL — photo가 책을 요구하고, write/decorate 조건이 옛것이다

- [ ] **Step 3: `traceGuard.service.ts`를 교체한다**

```ts
import type { TraceDraft } from '../_types/traceDraft.type'

const START = '/trace/new'

/** 생각 작성 단계에서 받아야 할 값이 다 찼는지. 페이지·의견 둘 다 필수다. */
function hasWritten(draft: TraceDraft): boolean {
  return draft.pageNumber !== null && draft.content.trim().length > 0
}

export function resolveGuardRedirect(pathname: string, draft: TraceDraft): string | null {
  // 이미 저장된 흔적이 있으면 작성 단계로 되돌아갈 수 없다.
  // 다만 첫 화면은 새 흔적을 시작하는 자리라 막지 않는다 — 막으면 done에 갇힌다.
  if (draft.result !== null && pathname !== `${START}/done` && pathname !== START) {
    return `${START}/done`
  }
  if (pathname === `${START}/done`) {
    return draft.result ? null : START
  }
  // photo는 선행 조건이 없다 — 책은 마지막에 고르고 대목은 여기서 얻는다
  if (pathname === `${START}/write`) {
    return draft.quotedText ? null : START
  }
  if (pathname === `${START}/decorate`) {
    if (!draft.quotedText) return START
    return hasWritten(draft) ? null : `${START}/write`
  }
  if (pathname === `${START}/book`) {
    if (!draft.quotedText) return START
    if (!hasWritten(draft)) return `${START}/write`
    return draft.decorations.length > 0 ? null : `${START}/decorate`
  }
  return null
}
```

- [ ] **Step 4: 통합 네비게이션 테스트를 새 순서로 갱신한다**

`traceStepNavigation.spec.tsx`의 기대값을 바꾼다.

```tsx
it('꾸미기에서 뒤로 가면 push 없이 생각 작성으로 replace한다', () => {
  renderAt('/trace/new/decorate')
  fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

  expect(replaceMock).toHaveBeenCalledWith('/trace/new/write')
  expect(pushMock).not.toHaveBeenCalled()
})

it('생각 작성에서 뒤로 가면 방식 선택으로 replace한다', () => {
  renderAt('/trace/new/write')
  fireEvent.click(screen.getByRole('button', { name: '뒤로' }))

  expect(replaceMock).toHaveBeenCalledWith('/trace/new')
})

it('단계에 들어서면 다음 단계 route를 미리 프리페치한다', () => {
  renderAt('/trace/new/write')
  expect(prefetchMock).toHaveBeenCalledWith('/trace/new/decorate')
})
```

`'대목 담기'` Probe의 `selectBook` dispatch는 남겨도 되지만, 이제 책이 없어도 이탈 확인이 떠야 하므로 **대목만 담는 케이스**를 추가한다.

```tsx
it('책 없이 대목만 있어도 닫기는 확인을 받는다', () => {
  renderAt('/trace/new/write')
  fireEvent.click(screen.getByRole('button', { name: '대목 담기' }))
  fireEvent.click(screen.getByRole('button', { name: '닫기' }))

  expect(replaceMock).not.toHaveBeenCalled()
})
```

- [ ] **Step 5: 남은 참조를 정리한다**

```bash
grep -rn "TraceStepHeader\|BookPicker\|TraceDetailForm\|TraceOpinionForm\|'detail'\|'opinion'\|'search'" "app/(app)/trace/new" app/_shared/trace
git rm "app/(app)/trace/new/_components/TraceStepHeader/TraceStepHeader.tsx"
```

남은 것이 있으면 지우거나 새 이름으로 바꾼다. `TraceNewSkeleton`이 옛 첫 화면(책 검색) 모양이면 방식 선택 시트 진입에 맞게 손본다 — 시트는 즉시 뜨므로 뒤 배경(`bg-bg-dark`)만 있으면 충분하다.

- [ ] **Step 6: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 전부 PASS

- [ ] **Step 7: 실제 앱에서 플로우를 한 번 통과시킨다**

```bash
pnpm build && pnpm start
```

브라우저에서 `/trace/new` → 직접 입력 → 페이지·의견 → 효과 선택 후 드래그 → 책 검색·등록 → 완료까지 걸어 본다. 웹뷰(`next dev`)에서는 하이드레이션이 안 되므로 반드시 프로덕션 빌드로 확인한다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "refactor: 단계 가드를 새 순서로 조이고 옛 화면 잔여 정리"
```

---

---

### Task 11: 갱신된 시안 반영

Task 1~10을 마친 뒤 디자인이 갱신되어 세 화면의 문구·요소가 달라졌다. 기능은 그대로 두고 표면만 맞춘다.

**Figma**

- 방식 선택 시트: [3077-16085](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=3077-16085)
- OCR 발췌 시트: [3077-15994](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=3077-15994)
- ③ 확인 화면: [3092-14086](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=3092-14086)

**Files:**

- Modify: `app/(app)/trace/new/_components/TraceSourceSheet/TraceSourceSheet.tsx`
- Modify: `app/(app)/trace/new/_components/OcrQuoteSheet/OcrQuoteSheet.tsx`
- Modify: `app/(app)/trace/new/_components/TraceBookForm/TraceBookForm.tsx`
- Modify: `app/(app)/trace/new/_components/TraceOpinionPreview/TraceOpinionPreview.tsx`
- Create: `app/_global/_components/Icon/assets/refresh.svg` (다시 찍기 아이콘)
- Test: `app/(app)/trace/new/_tests/traceBookForm.spec.tsx`, `traceSourceView.spec.tsx` (문구 변경 반영)

**바뀌는 것**

| 화면           | 지금                                             | 시안                                      |
| -------------- | ------------------------------------------------ | ----------------------------------------- |
| 방식 선택 시트 | `지금 기록을 남기는 책` 배지가 회색 위 회색 글씨 | **오렌지 pill + 흰 글씨**                 |
| OCR 발췌 시트  | 제목 `사진으로 입력`                             | **`발췌된 문장은 직접 수정할 수 있어요`** |
| OCR 발췌 시트  | 다시 찍기 = 카메라 아이콘                        | **회전(↻) 아이콘**                        |
| ③ 확인 화면    | 책 카드 전체가 `책 다시 고르기` 버튼             | **카드 우측에 `편집하기` 버튼**           |
| ③ 확인 화면    | 의견 라벨 `의견`                                 | **`{닉네임}님이 기록한 의견`**            |
| ③ 확인 화면    | CTA `등록하기`                                   | **`기록 완료`**                           |

글자수 카운터(`100 / 150`)는 `Textarea`가 이미 그리고 `MAX_QUOTE_LENGTH`도 이미 150이라 손댈 것이 없다.

- [ ] **Step 1: 문구 변경을 테스트에 먼저 반영해 실패를 확인한다**

`traceBookForm.spec.tsx`의 `등록하기` → `기록 완료`로 바꾸고, 책 편집 진입을 `getByRole('button', { name: '편집하기' })`로 바꾼다. 의견 헤딩 검증도 더한다.

```tsx
it('의견 헤딩에 닉네임이 들어간다', async () => {
  renderForm()
  await pickBook()

  expect(await screen.findByText('나님이 기록한 의견')).toBeTruthy()
})
```

닉네임은 `userQueries.me()`에서 오고, 기존 목이 `getMe: () => Promise.resolve({ data: { nickname: '나' } })`를 돌려준다.

Run: `pnpm test -- traceBookForm` → FAIL

- [ ] **Step 2: 확인 화면을 시안대로 고친다**

- 책 카드: 카드 전체 버튼을 걷어내고 `BookItem` 옆에 `편집하기` 버튼을 둔다. 시트를 여는 동작은 그대로.
- `TraceOpinionPreview`가 `nickname`을 받아 `{nickname}님이 기록한 의견`을 헤딩으로 그린다. 닉네임은 `TraceBookForm`이 `useQuery(userQueries.me())`로 읽어 넘기고, 없으면 `나`로 떨어진다(`BookSearchView`의 기존 처리와 같게).
- CTA 문구를 `기록 완료`로 바꾼다.

- [ ] **Step 3: 통과 확인**

Run: `pnpm test -- traceBookForm` → PASS

- [ ] **Step 4: OCR 시트 제목과 아이콘을 바꾼다**

제목을 `발췌된 문장은 직접 수정할 수 있어요`로 바꾼다. 다시 찍기 버튼의 `CameraIcon`을 회전 아이콘으로 교체하되, `aria-label="다시 찍기"`는 유지한다.

아이콘은 `.agents/icons.md` 절차를 따라 `app/_global/_components/Icon/assets/refresh.svg`로 추가한다(kebab-case, 색은 `currentColor`). Figma에서 에셋을 받을 수 없으면 규칙에 맞는 단순한 회전 화살표를 직접 만들고 그 사실을 리포트에 남긴다.

- [ ] **Step 5: 방식 선택 시트 배지를 오렌지 pill로 바꾼다**

`지금 기록을 남기는 책` 배지의 배경·글자색만 바꾼다(실제 존재하는 토큰만 사용). 문구와 구조는 그대로다.

- [ ] **Step 6: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 전부 PASS

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: 갱신된 시안에 맞춰 흔적 남기기 화면 문구와 요소 조정"
```

---

## 남은 확인거리

- **효과 미리보기**: 드래그 중에는 선택 하이라이트만 보인다. 시안이 효과 모양 미리보기를 요구하면 `DecoratedQuote`에 임시 decoration을 합성해 넘기는 방식으로 별도 처리한다(겹침 처리 때문에 `splitByDecorations` 동작을 먼저 확인해야 한다).
- **② 문장 꾸미기 시안**: 나오면 `TraceDecorateForm`의 레이아웃만 교체한다. 인터랙션(Task 7)과 뷰를 섞지 않았으므로 영향 범위가 좁다.
- **페이지 범위 초과 응답**: 서버가 돌려주는 에러 코드를 확인해 Task 9의 실패 메시지를 구체화한다.

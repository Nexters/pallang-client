# 흔적 열람 스크롤 변형 + 스포 마스킹 + 의견 상세 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/trace/[id]`에 스크롤 임계값 기반 포스트잇→고정 대목(270px) 레이아웃 전환, 스포일러 의견 Galmuri 마스킹, 의견 상세 오버레이를 추가한다.

**Architecture:** 페이지를 `h-dvh` 고정 + 흔적 리스트만 내부 스크롤(단일 소유)로 바꾸고, `useTraceViewMode` 훅이 scrollTop 히스테리시스로 `postit|compact`를 토글한다. 상세는 라우트 없이 상태 기반 풀스크린 오버레이.

**Tech Stack:** Next 16(App Router, client component), Tailwind v4 토큰, Vitest + Testing Library(happy-dom), galmuri 웹폰트 패키지.

## Global Constraints

- 스펙: `docs/superpowers/specs/2026-07-24-trace-scroll-transform-design.md`
- 전환 조건: scrollTop > 40 → compact, scrollTop < 8 → postit (히스테리시스)
- compact 대목 패널 높이 270px, PageTabs는 compact에서 숨김
- 스포 의견: Galmuri 폰트 마스킹만(블러·버튼 없음), 첫 클릭 = 해제, 이후 클릭 = 상세
- 상세 ← →: 정렬 순 이전/다음, 끝에서 비활성(루프 없음)
- default export 금지(page.tsx 제외), 컴포넌트 폴더 PascalCase, 훅 camelCase
- 각 태스크 종료 시 `pnpm lint && pnpm typecheck && pnpm test` 통과 후 커밋

---

### Task 1: Galmuri 폰트 등록

**Files:**

- Modify: `package.json` (galmuri 의존성)
- Modify: `app/layout.tsx` (css import)

**Interfaces:**

- Produces: `font-galmuri` Tailwind 유틸리티가 실제 Galmuri11 글꼴로 렌더됨 (`--font-galmuri` 토큰은 globals.css에 이미 존재)

- [ ] **Step 1: 패키지 추가**

```bash
pnpm add galmuri
```

(패키지가 없거나 dist 구조가 다르면: `ls node_modules/galmuri/dist`로 css 파일명 확인. 최후 수단은 GitHub quiple/galmuri 릴리즈에서 Galmuri11.woff2를 받아 `public/fonts`에 두고 globals.css에 @font-face 작성 — 이 경우 사용자에게 다운로드 사실 고지)

- [ ] **Step 2: layout에 css import**

`app/layout.tsx` 상단에:

```tsx
import 'galmuri/dist/galmuri.css'
```

- [ ] **Step 3: 검증 + 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add package.json pnpm-lock.yaml app/layout.tsx
git commit -m "feat: Galmuri 웹폰트 등록 (#17)"
```

---

### Task 2: 목 데이터 확장 (isSpoiler·comments)

**Files:**

- Modify: `app/trace/[id]/_types/readerHighlights.type.ts`
- Modify: `app/trace/[id]/_data/readerHighlights.constant.ts`

**Interfaces:**

- Produces: `type TraceComment = { id: string; nickname: string; content: string; createdAt: string }`
- Produces: `Trace`에 `isSpoiler: boolean`, `comments: TraceComment[]` 필드 추가

- [ ] **Step 1: 타입 추가**

`readerHighlights.type.ts`:

```ts
export type TraceComment = {
  id: string
  nickname: string
  content: string
  createdAt: string
}
```

기존 `Trace` 타입에 필드 추가:

```ts
  isSpoiler: boolean
  comments: TraceComment[]
```

- [ ] **Step 2: 시드 갱신**

`readerHighlights.constant.ts`의 `traceSeed` 각 항목에 `isSpoiler: false, comments: []` 추가. 최소 1개는 `isSpoiler: true`, 최소 1개는 comments 2개(닉네임 "지우"/"책장" 스타일, Figma 155:4166 참고):

```ts
comments: [
  { id: 'c1', nickname: '지우', content: '책장 냄새가 이렇게 묘사될 수 있구나 싶었어요.', createdAt: '2026-07-21T10:00:00' },
  { id: 'c2', nickname: '책장', content: '헌책방에 갈 때마다 이 냄새를 맡으면 마음이 차분해지거든요.', createdAt: '2026-07-20T09:00:00' },
],
```

- [ ] **Step 3: 검증 + 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add "app/trace/[id]/_types" "app/trace/[id]/_data"
git commit -m "feat: 흔적 목 데이터에 스포일러·댓글 필드 추가 (#17)"
```

---

### Task 3: useTraceViewMode 훅 (TDD)

**Files:**

- Create: `app/trace/[id]/_hooks/useTraceViewMode.ts`
- Test: `app/trace/[id]/_tests/useTraceViewMode.spec.ts`

**Interfaces:**

- Produces: `useTraceViewMode(): { viewMode: 'postit' | 'compact'; handleListScroll: (e: { currentTarget: { scrollTop: number } }) => void }`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useTraceViewMode } from '../_hooks/useTraceViewMode'

const scrollTo = (top: number) => ({ currentTarget: { scrollTop: top } })

describe('useTraceViewMode', () => {
  it('초기값은 postit', () => {
    const { result } = renderHook(() => useTraceViewMode())
    expect(result.current.viewMode).toBe('postit')
  })

  it('scrollTop 40 초과 시 compact로 전환', () => {
    const { result } = renderHook(() => useTraceViewMode())
    act(() => {
      result.current.handleListScroll(scrollTo(41))
    })
    expect(result.current.viewMode).toBe('compact')
  })

  it('히스테리시스: 8 이상에서는 compact 유지, 8 미만이면 postit 복귀', () => {
    const { result } = renderHook(() => useTraceViewMode())
    act(() => {
      result.current.handleListScroll(scrollTo(41))
    })
    act(() => {
      result.current.handleListScroll(scrollTo(20))
    })
    expect(result.current.viewMode).toBe('compact')
    act(() => {
      result.current.handleListScroll(scrollTo(7))
    })
    expect(result.current.viewMode).toBe('postit')
  })

  it('postit 상태에서 40 이하는 유지', () => {
    const { result } = renderHook(() => useTraceViewMode())
    act(() => {
      result.current.handleListScroll(scrollTo(39))
    })
    expect(result.current.viewMode).toBe('postit')
  })
})
```

- [ ] **Step 2: 실패 확인** — `pnpm test` → useTraceViewMode 없음으로 FAIL

- [ ] **Step 3: 구현**

```ts
import { useCallback, useRef, useState } from 'react'

const ENTER_COMPACT_AT = 40
const EXIT_COMPACT_AT = 8

export type TraceViewMode = 'postit' | 'compact'

type ScrollLike = { currentTarget: { scrollTop: number } }

export function useTraceViewMode() {
  const [viewMode, setViewMode] = useState<TraceViewMode>('postit')
  const modeRef = useRef<TraceViewMode>('postit')

  const handleListScroll = useCallback((event: ScrollLike) => {
    const top = event.currentTarget.scrollTop
    const next: TraceViewMode =
      modeRef.current === 'postit'
        ? top > ENTER_COMPACT_AT
          ? 'compact'
          : 'postit'
        : top < EXIT_COMPACT_AT
          ? 'postit'
          : 'compact'
    if (next !== modeRef.current) {
      modeRef.current = next
      setViewMode(next)
    }
  }, [])

  return { viewMode, handleListScroll }
}
```

- [ ] **Step 4: 통과 확인 + 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add "app/trace/[id]/_hooks/useTraceViewMode.ts" "app/trace/[id]/_tests/useTraceViewMode.spec.ts"
git commit -m "feat: 흔적 열람 뷰모드 훅 추가 (#17)"
```

---

### Task 4: QuotePanel + 레이아웃 전환

**Files:**

- Create: `app/trace/[id]/_components/QuotePanel/QuotePanel.tsx`
- Modify: `app/trace/[id]/page.tsx`
- Modify: `app/trace/[id]/_components/TraceListSection/TraceListSection.tsx`
- Test: `app/trace/[id]/_tests/readerHighlightsPage.spec.tsx` (확장)

**Interfaces:**

- Consumes: `useTraceViewMode` (Task 3)
- Produces: `QuotePanel({ quote, isCovered, onReveal }: { quote: string; isCovered: boolean; onReveal: () => void })`
- Produces: `TraceListSection`이 정렬 상태를 소유하지 않음 — props `{ traces: Trace[]; sortBy: 'latest' | 'likes'; onToggleSort: () => void; onToggleComment: () => void; onListScroll: (e: UIEvent<HTMLUListElement>) => void }` 형태로 변경 (정렬은 page로 승격)

- [ ] **Step 1: QuotePanel 작성**

```tsx
type QuotePanelProps = {
  quote: string
  isCovered: boolean
  onReveal: () => void
}

export function QuotePanel({ quote, isCovered, onReveal }: QuotePanelProps) {
  return (
    <div className="relative h-[270px] bg-bg-book-card px-6 py-8">
      <p className="h-full overflow-hidden text-body-20md text-text-secondary">{quote}</p>
      {isCovered && (
        <button
          type="button"
          onClick={onReveal}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-bg-book-card/70 backdrop-blur-[9px]"
        >
          <span className="text-title-16sb text-text-secondary">스포일러가 포함되어있어요!</span>
          <span className="text-body-14rg text-text-secondary opacity-70">
            누르면 확인 할 수 있어요
          </span>
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: page.tsx 개편**

- `main`: `mx-auto flex h-dvh w-full max-w-[530px] flex-col overflow-hidden bg-bg-dark`
- 정렬 상태 승격: `const [sortBy, setSortBy] = useState<'latest' | 'likes'>('latest')`, `sortedTraces` useMemo(기존 TraceListSection 로직 이동)
- 상단 섹션(shrink-0): `viewMode === 'postit'`이면 기존 스택(오렌지 배너+헤더+탭+카드+인디케이터), `compact`면 헤더+`<QuotePanel quote={...} isCovered={viewer.highlight.isSpoiler && !viewer.isRevealed} onReveal={viewer.clickCard}/>`+`<QuoteIndicator/>`
- `useTraceViewMode()`의 `handleListScroll`을 TraceListSection에 전달

- [ ] **Step 3: TraceListSection 개편**

정렬 상태 제거하고 props로 수신. 스크롤 소유자로 변경:

```tsx
<section className="flex min-h-0 flex-1 flex-col">
  <div className="flex h-15 shrink-0 items-center justify-between px-4">…기존 바…</div>
  <ul onScroll={onListScroll} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-10">
    …
  </ul>
</section>
```

- [ ] **Step 4: 테스트 확장**

`readerHighlightsPage.spec.tsx`에 추가 (기존 테스트는 구조 변화에 맞게 수정):

```tsx
it('리스트를 스크롤하면 페이지 탭이 숨겨지고 대목 패널이 고정된다', () => {
  render(<ReaderHighlightsPage />)
  const list = screen.getByRole('list')
  fireEvent.scroll(list, { target: { scrollTop: 60 } })
  expect(screen.queryByText('7p')).not.toBeInTheDocument()
})
```

(happy-dom에서 scroll 이벤트의 target.scrollTop 설정이 안 먹으면 `Object.defineProperty(list, 'scrollTop', { value: 60 })` 후 `fireEvent.scroll(list)`)

- [ ] **Step 5: 검증 + 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add "app/trace/[id]"
git commit -m "feat: 스크롤 임계값 기반 대목 고정 레이아웃 전환 (#17)"
```

---

### Task 5: 스포일러 의견 Galmuri 마스킹

**Files:**

- Modify: `app/trace/[id]/_components/TraceItem/TraceItem.tsx`
- Modify: `app/trace/[id]/_components/TraceListSection/TraceListSection.tsx` (props 전달)
- Modify: `app/trace/[id]/page.tsx` (revealedSpoilerIds 상태)
- Test: `app/trace/[id]/_tests/readerHighlightsPage.spec.tsx`

**Interfaces:**

- Consumes: `Trace.isSpoiler` (Task 2)
- Produces: `TraceItem` props → `{ trace: Trace; isMasked: boolean; onReveal: () => void; onSelect: () => void }` (기존 onCommentClick·isExpanded 제거)

- [ ] **Step 1: 실패하는 테스트**

```tsx
it('스포일러 의견은 첫 클릭에 마스킹만 해제된다', () => {
  render(<ReaderHighlightsPage />)
  const spoiler = screen.getByText(spoilerTraceContent) // 시드의 isSpoiler 항목 본문
  expect(spoiler).toHaveClass('font-galmuri')
  fireEvent.click(spoiler)
  expect(spoiler).not.toHaveClass('font-galmuri')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: TraceItem 수정**

- `isExpanded` 상태·토글 제거, `line-clamp-3` 상시 적용
- 본문 버튼: `onClick={() => (isMasked ? onReveal() : onSelect())}`
- 본문 클래스: ``className={`text-left text-body-16md text-text-inverse line-clamp-3 ${isMasked ? 'font-galmuri' : ''}`}``
- 댓글 아이콘 버튼: `onClick={onSelect}`

- [ ] **Step 3: page에 상태 추가**

```tsx
const [revealedSpoilerIds, setRevealedSpoilerIds] = useState<ReadonlySet<string>>(new Set())
const revealSpoiler = (id: string) => {
  setRevealedSpoilerIds((prev) => new Set(prev).add(id))
}
```

TraceListSection 경유로 `isMasked={trace.isSpoiler && !revealedSpoilerIds.has(trace.id)}`, `onReveal`, `onSelect` 전달 (onSelect는 Task 6 전까지 no-op).

- [ ] **Step 4: 검증 + 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add "app/trace/[id]"
git commit -m "feat: 스포일러 의견 Galmuri 마스킹·클릭 해제 (#17)"
```

---

### Task 6: TraceDetailOverlay (의견 상세)

**Files:**

- Create: `app/trace/[id]/_components/TraceDetailOverlay/TraceDetailOverlay.tsx`
- Modify: `app/trace/[id]/page.tsx`
- Test: `app/trace/[id]/_tests/readerHighlightsPage.spec.tsx`

**Interfaces:**

- Consumes: `QuotePanel`(Task 4), `TraceComment`(Task 2), `formatLikeCount`/`formatTraceDate`(기존 서비스), `CommentBar`(기존)
- Produces: `TraceDetailOverlay({ traces, index, quote, onNavigate, onClose }: { traces: Trace[]; index: number; quote: string; onNavigate: (index: number) => void; onClose: () => void })`

- [ ] **Step 1: 실패하는 테스트**

```tsx
it('의견 클릭 시 상세 오버레이가 열리고 X로 닫힌다', () => {
  render(<ReaderHighlightsPage />)
  fireEvent.click(screen.getAllByText(normalTraceContent)[0])
  const dialog = screen.getByRole('dialog', { name: /의견 상세/ })
  expect(within(dialog).getByText(normalTraceNickname)).toBeInTheDocument()
  fireEvent.click(within(dialog).getByLabelText('닫기'))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('상세에서 → 로 다음 의견으로 이동하고 끝에서는 비활성', () => {
  /* onNavigate 경계 검증 */
})
```

- [ ] **Step 2: 컴포넌트 구현**

```tsx
import BackIcon from '@/app/_global/_components/Icon/assets/back.svg'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import NextIcon from '@/app/_global/_components/Icon/assets/next.svg'

import { formatLikeCount, formatTraceDate } from '../../_services/traceFormat.service'
import type { Trace } from '../../_types/readerHighlights.type'
import { CommentBar } from '../CommentBar/CommentBar'
import { QuotePanel } from '../QuotePanel/QuotePanel'

type TraceDetailOverlayProps = {
  traces: Trace[]
  index: number
  quote: string
  onNavigate: (index: number) => void
  onClose: () => void
}

export function TraceDetailOverlay({
  traces,
  index,
  quote,
  onNavigate,
  onClose,
}: TraceDetailOverlayProps) {
  const trace = traces[index]
  if (!trace) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="의견 상세"
      className="fixed inset-0 z-20 mx-auto flex h-dvh w-full max-w-[530px] flex-col bg-bg-dark"
    >
      <header className="flex items-center gap-2 bg-bg-book-card px-4 py-2.5">
        <button
          type="button"
          aria-label="이전 의견"
          disabled={index === 0}
          onClick={() => {
            onNavigate(index - 1)
          }}
          className="disabled:opacity-30"
        >
          <BackIcon className="text-icon-primary" />
        </button>
        <span className="text-title-18bd text-text-secondary">{trace.nickname}</span>
        <button
          type="button"
          aria-label="다음 의견"
          disabled={index === traces.length - 1}
          onClick={() => {
            onNavigate(index + 1)
          }}
          className="disabled:opacity-30"
        >
          <NextIcon className="text-icon-primary" />
        </button>
        <button type="button" aria-label="닫기" onClick={onClose} className="ml-auto">
          <CloseIcon className="text-icon-primary" />
        </button>
      </header>
      <QuotePanel quote={quote} isCovered={false} onReveal={() => undefined} />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5">
        <p className="text-body-16md text-text-inverse">{trace.content}</p>
        <div className="flex items-center justify-between text-body-14rg text-text-inverse opacity-50">
          <span>{formatTraceDate(trace.createdAt)}</span>
          <span>공감 {formatLikeCount(trace.likeCount)}</span>
        </div>
        <p className="text-body-14sb text-text-inverse">댓글 ({trace.comments.length})</p>
        <ul className="flex flex-col">
          {trace.comments.map((comment) => (
            <li
              key={comment.id}
              className="flex flex-col gap-2 border-t border-dashed border-white/30 py-4"
            >
              <span className="text-body-14sb text-text-inverse opacity-60">
                {comment.nickname}
              </span>
              <p className="text-body-14rg text-text-inverse">{comment.content}</p>
              <span className="text-body-14rg text-text-inverse opacity-50">
                {formatTraceDate(comment.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <CommentBar />
    </div>
  )
}
```

- [ ] **Step 3: page 연결**

```tsx
const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null)
const selectedIndex = sortedTraces.findIndex((t) => t.id === selectedTraceId)
// TraceItem onSelect={() => setSelectedTraceId(trace.id)} (Task 5의 no-op 교체)
{
  selectedIndex >= 0 && (
    <TraceDetailOverlay
      traces={sortedTraces}
      index={selectedIndex}
      quote={viewer.highlight.quotes[viewer.quoteIndex] ?? ''}
      onNavigate={(next) => {
        const target = sortedTraces[next]
        if (target) setSelectedTraceId(target.id)
      }}
      onClose={() => setSelectedTraceId(null)}
    />
  )
}
```

- [ ] **Step 4: 검증 + 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add "app/trace/[id]"
git commit -m "feat: 의견 상세 오버레이 추가 (#17)"
```

---

### Task 7: 문서 갱신 + 실기기 확인

**Files:**

- Modify: `docs/reader-highlights-spec.md` (구현 메모 표)

- [ ] **Step 1:** 구현 메모 표에서 `스포일러 의견 블러`·`스크롤 시 대목 sticky 변형` 행을 `구현`으로 갱신, `의견 상세(댓글 열람) 오버레이 — 구현` 행 추가
- [ ] **Step 2:** dev 서버에서 `/trace/1` 열어 postit→compact 전환·스포 해제·상세 오버레이 육안 확인
- [ ] **Step 3:**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add docs/reader-highlights-spec.md
git commit -m "docs: 흔적 열람 구현 메모 갱신 (#17)"
```

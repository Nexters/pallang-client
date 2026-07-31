# TraceCollapseView 흐름 단위 관심사 분리

2026-07-30 · 대상: `app/trace/[id]/`

## 문제

`TraceCollapseView`(~200줄)가 쿼리 3개 체인(pageNumbers → passagesByPage → opinions), UI 훅 2개,
로컬 상태 3개, 에러 묶음, 무한스크롤 2개, 로그인 게이트를 전부 소유한다. 읽기 어렵고, 수정 영향
범위를 가늠하기 어렵고, 목록/상세 기능 확장 시 파일이 계속 자란다.

## 결정

쿼리 단위(세로)가 아니라 **흐름 단위(가로)** 로 자른다: 인용문 무대 흐름 vs 흔적 목록 흐름.
두 흐름이 공유하는 상태만 셸에 올린다.

```
TraceCollapseView (셸, 연결+레이아웃)
├─ usePassageViewer(bookId)          ← 무대 흐름 훅 — 셸에서 호출 (산출물을 두 흐름이 공유)
├─ useQuoteCollapse + scrollerRef    ← 접힘 제스처 (스크롤러 DOM 소유자라 셸)
├─ <QuoteStage/>                     ← 기존 그대로 (표시 전용)
├─ <TraceListPanel/>                 ← 새 컴포넌트 — useTraceList를 내부에서 소유
└─ <CommentBar/> + isCommentBarOpen  ← sticky bottom 레이아웃 제약으로 셸에 잔류
```

## 구성 요소

### `_hooks/usePassageViewer.ts` — 인용문 무대 흐름

pageNumbers 무한쿼리 → useHighlightViewer → passagesByPage 체인 + 페이지 탭 로그인 게이트 소유.

반환: `pages, highlight, quoteIndex, isRevealed, selectPage, clickQuote, loadMorePages(없으면
undefined), activePassage, isError, retry(실패 쿼리만 refetch)`

### `_hooks/useTraceList.ts` — 흔적 목록 흐름

opinions 무한쿼리 + sortType + selectedTraceId 소유. 정렬/필터/상세 액션 확장이 쌓이는 곳.

반환: `traces, traceCount, sortType, toggleSort, selectedTrace, selectTrace, closeTrace,
canFetchMore, fetchMore, isError, retry`

### `_components/TraceListPanel/TraceListPanel.tsx` — 목록 흐름의 컴포넌트 경계

`useTraceList`를 내부에서 호출. `TraceListSection` + 무한스크롤 sentinel + `TraceListError` +
`TraceDetailOverlay`(fixed라 스크롤러 안 렌더 무방)를 소유.

props(무대 흐름과의 연결점만): `passageId, quote, isMasked, className, scrollerRef,
stageError({isError, retry}), onToggleComment`

에러 UX 유지: 자기 에러 ∨ stageError를 합쳐 하나의 `TraceListError` + 일괄 재시도.
오버레이는 기존처럼 에러 조건 밖에서 렌더한다(에러 화면과 공존 가능).

## 불변 조건

- 동작·마크업·CSS 무변경. `readerHighlightsPage.spec.tsx` 통합 테스트 무수정 통과가 검증 기준.
- 훅별 단위 테스트는 추가하지 않는다 — 통합 테스트가 플로우 전체를 커버.
- `QuoteStage` 등 기존 표시 전용 컴포넌트는 손대지 않는다.

## 기각한 대안

- **섹션별 컨테이너가 각자 쿼리 소유(B)**: 단일 에러 화면 UX가 섹션 경계를 가로질러 상태 역류 필요.
  목록 쪽이 자체 화면 수준으로 커지면 그때 재검토.
- **화면 상태 store(C)**: 서버 상태는 이미 TanStack Query 캐시가 중앙, 클라이언트 상태 5개뿐.

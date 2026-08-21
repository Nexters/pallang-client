# 흔적 확인 페이지 재디자인 — 핸드오프

작성: 2026-08-20 · 상태: **조사·의사결정 완료, 코드 변경 0줄**
대상 화면: `app/(app)/trace/[id]/`

---

## 1. 시안 (Figma)

파일: `Wl5pM25b53Q0jpA8fi0TUC` (수미 작업 공간) · 링크 형식
`https://www.figma.com/design/Wl5pM25b53Q0jpA8fi0TUC/...?node-id=<node>&m=dev`

받은 20개 링크 중 **11개는 섹션 타이틀·주석 프레임**이고 실제 화면은 9개다.

| 화면 | 노드 | 비고 |
| --- | --- | --- |
| 페이지 1개 | `229-24354` | 칩 `122p`(셰브론 없음), 페이저 `01 / 01` 비활성 |
| 페이지 여러개(기본) | `229-24122` | **이 프레임이 기준** |
| 플로팅버튼 open | `229-24173` | 의견 남기기 / 기록 남기기 |
| 스포일러 | `229-24252` | 주석 `229-18246` |
| 의견 바텀시트 확장 | `229-24051` | ⚠️ **옛 레이아웃** — 좌표는 참고 금지, 시트 확장 개념만 |
| 답글 화면 | `229-24405` | 주석 `229-18243` "댓글 아이콘을 눌렀을 때 활성화됩니다" |
| 댓글 0개 | `229-24447` | ⚠️ 시안 자체가 모호 (아래 6번) |
| 문장 로딩 실패 | `229-24303` | 포스트잇 **안**에 일러 + 재시도 |
| 목록 로딩 실패 | `229-24224` | 시트 자리 전체가 재시도 화면 |

타이틀 프레임: `229-17947`(페이지1개) `229-17945`(페이지여러개) `229-17949`(플로팅버튼_open)
`229-17943`(스포일러) `229-17953`(선택시 바텀시트로 진입) `229-17939`(댓글바) `229-17972`(댓글0개)
`229-17964`(흔적 로딩 실패) `229-17956`(댓글이 로드 되지 않았을 때) + 주석 `229-18246` `229-18243`

### 시안에서 읽은 색·치수

- 무대 배경: **Brand `#EF5A06` 주황 밴드**, 상단 375×300, 아래 모서리 라운드
- 밴드 아래 ~488까지: **흰 면 `#FFFFFF`**
- 포스트잇: `Background/Book-Card #F7EECB`, **300×310**, y=106, **기울기 없음 / 검정 테두리 없음**
- 대목 페이저: 카드 아래 20px(y=436), 폭 303 중앙 정렬, 양끝 24px 화살표, 가운데 `01 / 05`
- 어두운 시트: y=488부터, 상단 handle(32×3) → InformationBar(58) → 흔적 목록
- 시트 하단 푸터 레이어 `229-24142`는 **hidden** — 안 그린다 (확정)

---

## 2. 확정된 결정 (사용자 답변)

| # | 질문 | 답 |
| --- | --- | --- |
| 1 | 스포일러 때 의견 목록도 가리나 | **가린다** — 현행 유지 (`isTraceListMasked`) |
| 2 | 스포일러 해제 상태 페이지 이동 후 유지 | 편한 방식으로 → **현행 유지** |
| 3 | `229-24051`(옛 레이아웃)과 나머지 8장 중 기준 | **나머지 8장** (300×310, 카드 밖 페이저) |
| 4 | "문장만 실패 / 목록은 정상"이 가능한가 | **불가능** — 대목이 깨지면 `passageId`가 없어 의견도 못 부른다 |
| 5 | 흔적/의견/댓글 용어 기준 | **시안 문구 그대로** (지금 코드 문구와 이미 일치) |
| 6 | `229-24447`(댓글 0개) 시안 모호 | **일단 넘어감** — 현행 유지 |
| 7 | 시트·답글 화면에서 FAB | **숨긴다** |
| 8 | 접힘(collapse) 전환 | **없앤다** |
| 9 | 시트 하단 푸터 레이어 | 시안대로 = hidden이므로 **안 그림** |

### 8번 후속 — 스크롤 구조 (선택 완료)

> **무대 고정 + 패널 드래그 확장**

```
[헤더  ← 모순      122p ∨]  ← 고정
[   포스트잇 카드   ]        ← 고정
[   ‹  01 / 05  ›   ]        ← 고정
╭───── handle ─────╮  ← 위로 드래그하면 확장
│ 17개의 의견 ›  최신순▾│
│ 흔적 ...            │ ← 이 안만 스크롤
│ 흔적 ...            │
```

무대는 스크롤에 반응하지 않는다. 어두운 패널만 자체 스크롤하고, 상단 handle을 위로 끌면
`229-24051`처럼 무대를 덮으며 확장된다. **확장된 모습 = 이미 있는 `TraceOpinionSheet`**이므로
새 시트를 만들지 말고 handle 드래그를 기존 `openSheet`에 연결하는 게 최소 구현이다.

---

## 3. 작업 계획

### A. 무대 배경: 크림 모눈종이 → 주황 + 흰 면

- `_components/QuoteStageBackdrop/QuoteStageBackdrop.tsx` — 3겹(크림/모눈종이/dark)을 주황 밴드 + 흰 면으로 교체. `public/images/trace-grid-paper.png` 사용처가 여기뿐이면 이미지도 삭제 대상
- `_components/TraceHeader/TraceHeader.tsx:33` — 코드 주석에 이미 예고돼 있다: *"주황 배경 시안을 반영할 때 `bg-white-a20`로 되돌린다"*. 지금 `bg-white-a60`인 모임 배지를 되돌린다
- 헤더 글자·아이콘이 주황 위 **흰색**이 된다 → `TopBar`의 `text-text-primary` 계열 재지정 필요
- `_components/PagePicker/PagePicker.tsx` — 유리 알약 `bg-black/10 backdrop-blur-[9px]`가 주황 위에서 어떻게 보이는지 확인
- `app/globals.css:83`의 `--color-bg-book-card: #f7f2c6` vs 시안 `#F7EECB` — 미세하게 다르다. 토큰 갱신 여부 판단

### B. 접힘 전환 제거 (가장 큰 삭제)

**삭제 대상**

- `_hooks/useQuoteCollapse.ts` (169줄) — 통째로
- `_services/quoteCollapse.service.ts` — `PANEL_HEIGHT`만 `QuotePanel`이 쓰므로 그 상수만 살리고 나머지(`STAGE_*` `COLLAPSE_*` `CARD_RISE` `easeOutCubic` `getTransitionIntent` `TOUCH_*` `WHEEL_TRIGGER_DELTA`) 제거
- `_data/widthTiming.constant.ts` — 접힘 폭 타이밍 전용
- `_components/QuoteStage/QuoteStage.module.css` — `--collapse`/`--inv` 기반 선언 전부. 카드가 더는 회전·확장하지 않으므로 `.cardSurface`도 정적 스타일로 내려간다(기울기·테두리 제거 = 시안)
- `_components/TraceCollapseView/TraceCollapseView.module.css` — `.scrollerLocked` `.stageSpacer` `.stageAnchor` 및 `--collapse` 초기화
- `_tests/quoteCollapse.spec.ts` — 통째로

**수정 대상**

- `_components/TraceCollapseView/TraceCollapseView.tsx` — `scrollerRef`/`stageStyle`/`isCollapsed` 배선 제거. 무대와 패널을 형제로 두고 패널만 `overflow-y-auto`
- `_components/QuoteStage/QuoteStage.tsx` — `isCollapsed` prop 제거
- `_components/QuoteSpoilerCover/QuoteSpoilerCover.tsx` — `isCollapsed` 분기(글자 크기·굵기 보간) 제거
- `_components/TraceListSection/TraceListSection.tsx` — sticky 헤더의 `top-[calc(var(--safe-top)+var(--stage-collapsed))]` → 패널 자체 스크롤이므로 `top-0`
- `_components/TracePageSkeleton/TracePageSkeleton.tsx` — 새 좌표(주황 밴드 + 카드 300×310 + 페이저 자리)로 다시 그린다. **`<Suspense>` fallback이 이거라 비우면 안 된다** (`_tests/tracePageFallback.spec.tsx`가 잠금)
- `_components/QuotePanel/QuotePanel.tsx` — `PANEL_HEIGHT`가 "축소 상태 스테이지 높이"라는 근거를 잃는다. 상수를 QuotePanel 쪽으로 옮기고 주석 수정
- `_types/readerHighlights.type.ts` — `QuoteStageProps`의 `isCollapsed`

**같이 깨질 수 있는 spec** (`collapse` 문자열 기준)

```
_tests/quoteCollapse.spec.ts              ← 삭제
_tests/readerHighlightsPage.spec.tsx
_tests/moderation.spec.tsx
_tests/traceComments.spec.tsx
_tests/traceDetailOverlayTransition.spec.tsx
_tests/traceLike.spec.tsx
_tests/tracePrefetch.spec.ts
```

대부분 `TraceCollapseView`를 렌더해서 걸리는 것이므로 렌더 헬퍼만 고치면 될 가능성이 높다.

### C. 대목 페이저 신설

`_components/QuoteStage/QuoteStage.tsx` — 지금은 **카드 안 우하단**에 화살표 두 개뿐이고 인덱스 표기가 없다.
해당 위치에 `ponytail:` 주석이 달려 있다(*"시안의 화살표는 아직 스크린샷을 붙여둔 자리라 에셋이 없다"*) → 이번에 에셋 확정.

- 카드 **밖** 아래 20px, 중앙 정렬, 폭 303
- 양끝 24px 화살표, 가운데 `01 / 05` (현재 인덱스는 강조, 총 개수는 흐리게)
- 대목 1개면 화살표 비활성 + `01 / 01`
- 좌우 스와이프(`useQuoteSwipe`)는 그대로 둔다

### D. 카드 치수·모양

`_services/quoteCollapse.service.ts`(또는 이관될 상수 파일)

- `CARD_WIDTH 312 → 300`, `CARD_HEIGHT 320 → 310`
- 기울기 `rotate(-3deg)` **제거**, 검정 1px 테두리 **제거**, 그림자는 `Shadow_card`(`#00000033`, offset 4/10, blur 35)

### E. 문장 로딩 실패를 카드 안에 (`229-24303`)

4번 답이 "그런 상태는 안 나온다"이므로 **목록 병합 로직은 그대로 둔다**
(`_hooks/useTraceList.ts:98` `stageError.isError || opinionsQuery.isError` 유지).
대신 `stage.isError`를 `QuoteStage`까지 내려 **카드 안에도** 시안 화면을 그린다 — 최소 diff.

- 일러스트: `public/images/sad-friends.png` 이미 있음 (`FeedbackState` 기본값과 동일)
- 문구: "문장을 불러오지 못했어요. / 다시 시도해주세요." + `다시 시도하기`
- 재시도는 `stage.retry` — 목록 쪽 `TraceListError`와 같은 핸들러

### F. FAB 숨김 범위 확대

`_components/TraceCollapseView/TraceCollapseView.tsx` — 지금은 `isDetailOpen`(상세 오버레이)일 때만 숨긴다.
**의견 바텀시트·답글 화면이 열려 있을 때도 숨긴다.** `useOpinionSheet`에 이미
`isBottomBusy = detail !== null || expandedOpinionId !== null`가 있으니 여기에 시트 open을 더해
`onDetailOpenChange`로 올려보내면 된다.

> 참고: 시안 `229-24405`/`229-24447`에는 FAB이 그려져 있지만 하단 댓글바와 겹친다 → **숨기기로 확정**.

### G. 변경 없음 (확인만)

- 스포일러 목록 가림 — 현행 유지
- 페이지 1개일 때 칩 셰브론 없음 — `PagePicker`에 **이미 구현됨**
- 목록 실패 문구 "앗! 흔적들이 도착하지 않았어요!" — 시안과 **이미 일치**
- 빈 댓글 카드 "아직 남겨진 댓글이 없습니다 / 첫번째 댓글을 달아주세요!" — **이미 일치**
- FAB 두 갈래 "의견 남기기 / 기록 남기기" — **이미 일치**
- 답글 화면(`OpinionReplyScreen`) + 댓글바 — **이미 일치**

---

## 4. 남은 미해결

- **`229-24447`(댓글 0개) 시안이 모순적이다.** `← 답글 (3)` 헤더 아래에 빈 카드가 뜨는데
  그 아래로 *다른 의견들이* 이어진다. 답글 화면이면 원본 의견 하나만 있어야 한다.
  → 6번 답이 "일단 넘어가"이므로 현행 유지. 나중에 디자이너 확인 필요
- **접힘 제거 후 `TraceDetailOverlay`의 자리.** 새 시안 20장에 상세 오버레이가 없다.
  딥링크(`initialTraceId`) 진입 경로가 이걸 쓰므로 지금은 남기지만, 의견 시트와 역할이 겹친다
- **주황 배경에서 헤더 대비.** 시안 헤더 글자가 흰색인지 검정인지 렌더에서 애매하다. 실기기 확인 권장
- **접힘이 사라지면서 `--stage-collapsed`를 쓰던 sticky 좌표가 전부 무의미**해진다.
  누락하면 정렬 바가 화면 밖에 붙는다

---

## 5. 재개할 때

```bash
git switch -c feat/<이슈번호>-trace-redesign   # base: develop
```

검증: `pnpm lint && pnpm typecheck && pnpm test`
(B의 삭제 범위가 커서 `pnpm test` 먼저 돌려 깨지는 spec 목록부터 확보하는 편이 빠르다)

관련 규칙: `AGENTS.md`의 **로딩 화면**(Suspense fallback 필수), **모션**(duration 토큰 강제),
**Safe area**(`-mt-(--safe-top)` 풀블리드 화면 규칙 — 이 화면이 그 예시로 문서에 박혀 있으니
접힘 제거하면서 `AGENTS.md`도 같이 손봐야 한다).

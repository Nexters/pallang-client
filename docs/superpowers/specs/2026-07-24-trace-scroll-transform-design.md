# 흔적 열람: 스크롤 변형 + 스포일러 마스킹 + 의견 상세 — 설계

> 기반 기획서: `docs/reader-highlights-spec.md` 3절
> Figma: 155:4535(포스트잇 상태) · 155:4028(변형 상태) · 155:4166(의견 상세)
> 라우트: `app/trace/[id]/`

## 범위

1. 스크롤 시 포스트잇 → 고정 대목(270px) 레이아웃 전환 (임계값 토글)
2. 스포일러 의견 Galmuri 폰트 마스킹 + 클릭 해제
3. 의견 클릭 시 상세 오버레이 (댓글/대댓글 열람, ← → 의견 이동)

제외: 꾸밈(밑줄·동그라미) 렌더링(서버/에디터 필요), 대댓글 작성 동작, 신고하기.

## 결정 사항

| 항목        | 결정                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------- |
| 전환 방식   | 임계값 토글 + CSS transition (~250ms). 연속 보간·스크롤 스냅 배제                              |
| 스크롤 구조 | 페이지 `h-dvh flex flex-col` 고정, 흔적 리스트만 `overflow-y-auto flex-1` (스크롤 소유자 단일) |
| 전환 조건   | 리스트 scrollTop > 40 → compact, scrollTop < 8 → postit (히스테리시스)                         |
| 상세 화면   | 페이지 내 풀스크린 오버레이 (라우트 아님, X로 닫기)                                            |
| 스포 마스킹 | Galmuri 폰트 렌더만 (블러·버튼 없음), 클릭 시 해제                                             |

## 상태 모델 (page 레벨)

```
viewMode: 'postit' | 'compact'   ← useTraceViewMode 훅이 리스트 scrollTop으로 관리
selectedTraceId: string | null   ← 상세 오버레이 대상
revealedSpoilerIds: Set<string>  ← 해제된 스포 의견 (메모리만, 새로고침 리셋)
```

기존 `useHighlightViewer`(대목/페이지 전환), `useLoginGate`, 정렬 상태 유지.

## 레이아웃

- **postit**: 오렌지 배너 + TraceHeader + PageTabs + HighlightCard + QuoteIndicator (현행 유지). 리스트는 하단에 일부 노출
- **compact**: TraceHeader + `QuotePanel`(크림 배경, 270px, 대목 텍스트 + QuoteIndicator). PageTabs 숨김 — 페이지 전환은 postit 복귀 후 가능
- 하단 공통: `n개의 흔적`/정렬 바 + 리스트(내부 스크롤) + CommentBar

## 컴포넌트

| 이름                         | 역할                                                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QuotePanel` (신규)          | compact 대목 패널. 스포 대목 블러는 HighlightCard 패턴 재사용                                                                                                 |
| `TraceDetailOverlay` (신규)  | `← 닉네임 →` 이동(끝에서 비활성, 루프 없음) + X 닫기, QuotePanel 재사용, 의견 전문, 좋아요, 댓글 n + 대댓글 리스트(1-depth, 답글달기는 UI만), 하단 CommentBar |
| `useTraceViewMode` (신규 훅) | 스크롤 ref + viewMode 반환, 히스테리시스 내장                                                                                                                 |

## 동작 규칙

- 의견 본문 클릭 = 상세 오버레이 열기. 기존 리스트 내 3줄 펼침 토글은 제거 (전문은 상세에서 확인). 댓글 아이콘도 상세 열기
- 스포 의견: `isSpoiler && !revealed` → 본문 Galmuri 폰트, 첫 클릭은 해제만 (상세 안 열림)
- 비로그인 게이트 기존 규칙 유지 (상세 열람 허용, 댓글 작성 시 로그인 유도)
- Galmuri woff2를 `public/fonts`에 추가하고 `@font-face` 등록 (현재 `--font-galmuri` 토큰만 존재)

## 데이터·테스트

- `Trace`에 `isSpoiler: boolean`, `comments: TraceComment[]`(id·닉네임·내용·작성일) 추가, 시드 확장
- 테스트: `useTraceViewMode` 히스테리시스 / 스포 1클릭 해제 → 2클릭 상세 / 오버레이 열기·이동·닫기 — `readerHighlightsPage.spec.tsx` 확장

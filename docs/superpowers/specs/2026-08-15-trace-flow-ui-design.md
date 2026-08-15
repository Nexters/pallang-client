# 흔적 남기기 플로우·UI 개편 설계

날짜: 2026-08-15
브랜치: `feat/trace-flow-ui` (base: `develop` @ 9c5e764)
Figma

- 방식 선택 시트: [3077-16085](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=3077-16085)
- ① 생각 작성: [3082-36168](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=3082-36168)
- ③ 책 검색 시트: [3077-16108](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=3077-16108) · [3077-16138](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=3077-16138)
- ③ 확인 화면: [3092-14086](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=3092-14086)

## 목표

흔적 작성 플로우의 순서를 뒤집는다. **책 선택이 첫 단계에서 마지막 단계로 내려가고, 진입하면 곧바로 대목부터 입력한다.** 사용자에게 보이는 단계는 세 개다.

```
진입 → [방식 선택 시트] ─ 사진 ─→ 카메라·OCR ─┐
                        └ 직접 입력 ─→ 입력 시트 ─┴→ ① 생각 작성 → ② 문장 꾸미기 → ③ 책 등록하기 → 완료
```

| 단계          | 담는 것                              |
| ------------- | ------------------------------------ |
| ① 생각 작성   | 대목 + 페이지 · 스포일러 · **의견**  |
| ② 문장 꾸미기 | **효과를 먼저 고르고** 드래그해 적용 |
| ③ 책 등록하기 | 책 검색 시트 → 확인 → 등록           |

## 전제

- `develop`(9c5e764) 기준. 라우트는 `app/(app)/` 그룹 아래에 있다.
- **API는 바꾸지 않는다.** 저장은 지금처럼 `POST /api/opinions` 단일 호출로 Passage + Opinion + Decoration을 한 번에 만든다. 호출 시점만 ③으로 옮겨간다.
- 기존 네비게이션 골격(`TraceNavProvider` · `TraceStepGuard` · `useOverlayBackGuard`)을 유지한다. Capacitor 웹뷰라 하드웨어 뒤로가기 처리가 민감하고, 지금 구조가 이미 그 문제를 풀어 두었다.
- ②(문장 꾸미기) 시안이 없다. 기존 `/decorate` 레이아웃(노트 + 하단 효과 그리드)을 유지하고 인터랙션만 뒤집는다.
- ③ 확인 화면의 **의견 표시는 디자인 미정**이라 이 문서에서 정한다.

## 결정 사항

| 결정                                       | 근거                                                                                                                                |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 단계는 3개, route는 6개 유지               | 사용자에게 보이는 단계(①②③)와 화면 수는 다르다. 시트·OCR·완료는 인디케이터에 세지 않되 각자 route를 가져 뒤로가기가 공짜로 동작한다 |
| `/detail` → `/write`, `/opinion` → `/book` | 역할이 통째로 바뀐다. 이름을 그대로 두면 파일 내용과 경로가 어긋나 읽는 사람이 계속 헷갈린다                                        |
| 방식 선택 시트를 모든 진입에서 노출        | 씨앗이든 탭바든 첫 화면이 같다. 사진·직접 입력이 항상 동등한 선택지가 되어 카메라를 못 쓰는 상황에서도 막히지 않는다                |
| 씨앗은 책만 나른다                         | 대목은 항상 새로 입력한다. 같은 대목인지는 ③의 유사 검사가 판정하므로 `passageId`를 미리 물고 갈 이유가 없다                        |
| 병합 검사는 책 선택 직후                   | `similar-check`는 `bookId`가 있어야 돈다. 확인 화면에 닿기 전에 병합 결정을 끝내 마지막 '등록하기'가 한 번에 끝나게 한다            |
| 페이지 번호 상한 검증 제거                 | ①에서 페이지를 받을 때는 아직 책이 없어 `pageCount`를 모른다. 자릿수(5자리)·양수만 보고, 초과는 서버 응답으로 처리한다              |
| 의견·꾸밈 모두 필수 유지                   | 서버가 꾸밈을 요구하고(`createOpinion`), 의견 없는 흔적은 화면에 보여 줄 내용이 없다                                                |
| 완료 화면 유지                             | 등록 결과와 다음 행동(흔적 보러 가기·새 흔적)을 주는 자리다. 인디케이터에는 세지 않는다                                             |
| `BottomSheet`를 확장해서 재사용            | 모달·시트를 새로 만들지 않는 규칙이 있다. 책 검색 시트가 요구하는 전체 높이·뒤로 헤더·하단 고정 CTA를 prop으로 흡수한다             |

## 1. 스텝과 라우팅

```ts
// _services/traceStepNav.service.ts
export type TraceStep = 'source' | 'photo' | 'write' | 'decorate' | 'book' | 'done'
```

| step       | route                 | 화면                        | 인디케이터    |
| ---------- | --------------------- | --------------------------- | ------------- |
| `source`   | `/trace/new`          | 방식 선택 시트              | —             |
| `photo`    | `/trace/new/photo`    | 카메라 · OCR 블록 선택      | —             |
| `write`    | `/trace/new/write`    | 대목 + 페이지·스포일러·의견 | ① 생각 작성   |
| `decorate` | `/trace/new/decorate` | 효과 선택 → 드래그          | ② 문장 꾸미기 |
| `book`     | `/trace/new/book`     | 책 검색 시트 → 확인 → 등록  | ③ 책 등록하기 |
| `done`     | `/trace/new/done`     | 완료                        | —             |

**프리페치**(`NEXT_STEPS`)

```
source → [photo, write]   // 사진·직접입력 어느 쪽을 눌러도 왕복이 없다
photo → [write]           write → [decorate]
decorate → [book]         book → [done]        done → [source]
```

**뒤로가기**(`resolveBackTarget`)

```
photo, write → source (clearQuote: true)   // 대목을 다시 얻어야 하므로 비운다
decorate → write (clearQuote: false)
book → decorate (clearQuote: false)
source, done → exit                        // 플로우 이탈 확인을 거친다
```

## 2. 단계 가드

`resolveGuardRedirect`의 규칙("앞 단계 결과가 없으면 되돌린다")은 그대로다. 선행 조건이 `book`에서 `quotedText`로 바뀌는 것이 핵심이다.

```
result가 있으면          → done  (첫 화면과 done 자신은 예외)
done                     → result 없으면 START
photo                    → 조건 없음
write                    → quotedText 없으면 START
decorate                 → quotedText 없으면 START
                           pageNumber가 null이거나 content가 비면 write
book                     → 위 조건에 더해 decorations가 비면 decorate
```

## 3. 상태와 저장

`TraceDraft` 필드와 액션은 그대로 두고 **채워지는 순서만** 바뀐다(`book`이 마지막). 새 액션은 필요 없다.

| 단계     | 채우는 값                                      |
| -------- | ---------------------------------------------- |
| source   | `source`('photo' \| 'manual'), 씨앗이면 `book` |
| photo    | `quotedText`                                   |
| write    | `pageNumber` · `isSpoiler` · `content`         |
| decorate | `decorations`                                  |
| book     | `book` · `passageId`(병합 선택) · `result`     |

**저장은 ③의 '등록하기'로 옮겨간다.** 지금 `TraceOpinionForm.handleSubmit`에 있는 로직 — 401이면 로그인 게이트로 보내고, `PASSAGE_400_2`·`PASSAGE_404_1`(병합 대상 소멸)이면 `passageId`를 비운 뒤 재시도를 안내하고, **실패해도 draft를 버리지 않는** 처리 — 를 그대로 가져간다. 이 시점의 유실 비용이 플로우 전체에서 가장 크다.

**병합 검사**는 책을 고른 직후 `similar-check`를 돌리고 후보가 있으면 `MergeDialog`를 띄운다. 책을 바꾸면 다시 검사하며, `selectBook` 리듀서가 이미 `passageId`를 비우므로 이전 병합 대상이 남지 않는다. 검사 실패는 지금처럼 무시하고 진행한다.

## 4. 씨앗 축소

```ts
export type TraceSeed = { bookId: number; bookTitle: string; bookCoverImageUrl: string | null }
```

`TraceSeedPassage`와 `passageId` · `page` · `quote` · `spoiler` 쿼리 파라미터가 사라진다. `buildTraceSeedHref`·`parseTraceSeed`가 그만큼 줄고, 흔적 상세(`TraceCollapseView`)의 `goCreateTrace(passage)`는 인자 없는 호출이 된다. **호출부가 여러 곳이므로 구현 시 전부 확인한다**(대목별 진입 버튼의 문구가 "이 대목에 남기기"라면 의미가 달라져 함께 손봐야 한다).

씨앗이 있으면 `source` 시트에 "지금 기록을 남기는 책" 배지가 뜨고, ③은 검색 시트를 자동으로 열지 않고 그 책이 선택된 확인 화면으로 바로 들어간다.

## 5. 화면별 설계

### source (`/trace/new`)

`BookPicker`가 빠지고 방식 선택 시트만 남는다. `TraceSeedBoundary`는 그대로 씨앗을 읽되 `selectBook`만 던진다.

- `TraceSourceSheet`에 책 배지 추가(`draft.book`이 있을 때만)
- 사진 → `setSource('photo')` → `photo`
- 직접 입력 → `setSource('manual')` → `ManualQuoteSheet` → 제출 시 `setQuotedText` → `write`
- 시트를 닫으면(X) 플로우 이탈 확인

### photo (`/trace/new/photo`)

`OcrSelector` 유지. 도착지만 `write`로 바꾸고, **OCR 실패·권한 거부 화면에 "직접 입력하기"를 갤러리 버튼과 나란히 둔다**(같은 화면에서 `ManualQuoteSheet`를 열어 `write`로 보낸다). 카메라가 막힌 사용자가 첫 화면까지 되돌아가지 않아도 된다.

### write ① (`/trace/new/write`)

`TraceWriteForm` 신설 — 지금의 `TraceDetailForm`(페이지·스포일러)과 `TraceOpinionForm`(의견 300자)을 한 화면으로 합친다.

- 대목은 읽기 전용 `TraceNote`
- 페이지·스포일러는 로컬 state로 받고 '다음'에서 `setPageDetail`(뒤로 왔다가 다시 들어와도 draft에서 시드하는 기존 패턴 유지)
- 의견은 `draft.content`에 직접 반영
- '다음' 비활성: 페이지가 유효하지 않거나 의견이 공백일 때

### decorate ② (`/trace/new/decorate`)

인터랙션을 반전한다(6절). `similar-check` 호출은 여기서 빠지고 '다음'은 `book`으로 간다. '다음' 비활성 조건(꾸밈이 하나도 없을 때)은 그대로다.

### book ③ (`/trace/new/book`)

`TraceBookForm` 신설.

- 진입 시 `draft.book`이 없으면 검색 시트를 연다
- 책 선택 → `selectBook` → 시트 닫힘 → `similar-check` → 후보가 있으면 `MergeDialog`
- 확인 화면: **책 카드**(탭하면 검색 시트가 다시 열린다) + **꾸밈이 반영된 대목** + **의견**
- '등록하기' → `createOpinion` → `setResult` → `done`

**의견 표시(디자인 미정분)** — 대목 카드 아래에 `의견` 라벨과 작성한 내용을 읽기 전용 카드로 둔다. 대목 카드와 같은 가로 여백을 쓰고 어두운 면 위 본문 톤으로 맞춘다.

### 책 검색 시트

`BookSearchView`에서 화면용 껍데기(`main` · `TopBar` · safe-area 처리)를 벗겨 시트 본문으로 옮긴다. 검색·캐러셀·무한스크롤·알라딘 폴백 로직은 그대로 재사용한다.

시안이 요구하는 차이는 **선택이 즉시 확정되지 않는다**는 점이다. 목록·캐러셀에서 고른 책은 시트 내부의 후보 state로 들어가고, 하단 고정 '등록하기'로 확정된다. "찾는 책이 없나요? 새 책 등록하기"는 지금처럼 `BookAddForm`을 얹는다.

### done (`/trace/new/done`)

변경 없음. 새 흔적으로 다시 시작하는 경로가 `source`를 가리키는지만 확인한다.

## 6. 꾸미기 인터랙션 반전

지금은 `드래그로 범위 선택 → 효과 탭 → 적용`이고, 범위 없이 효과를 누르면 "영역 선택 후 효과를 입력해주세요" 스낵바가 뜬다. 이것을 뒤집는다.

```
효과 탭(활성 표시) → 노트를 드래그(그 효과로 미리보기) → 손을 떼는 순간 적용
```

- `TraceDecorateForm`에 `activeEffect: EffectOption | null` 추가
- `EffectPicker`에 선택 상태 prop을 추가해 고른 효과를 활성으로 표시
- `useTextRangeSelection`에 **손을 뗀 시점**을 알리는 콜백 추가(현재는 앵커만 리셋한다). 그 시점에 `applyDecoration`
- 적용 후에도 효과 선택은 남긴다 — 연속으로 칠할 수 있어야 한다
- 효과를 고르지 않은 채 드래그하면 선택을 잡지 않고 "효과를 먼저 선택해주세요"로 안내한다(기존 문구의 반대)
- 이미 효과가 들어간 자리를 탭하면 색 변경·삭제 팝오버가 뜨는 동작은 그대로 두고, 효과가 선택된 상태에서도 팝오버를 우선한다

드래그 중 미리보기를 고른 효과 모양으로 그리려면 `TraceNote`의 `pendingRange` 렌더링에 효과 종류를 넘겨야 한다. 구현 시 현재 렌더링 방식을 확인해 최소 변경으로 처리한다.

## 7. `BottomSheet` 확장

책 검색 시트는 화면 대부분을 덮고, 헤더가 X가 아니라 ←이며, 목록이 안에서 스크롤되고 하단에 CTA가 고정된다. 현재 `BottomSheet`는 콘텐츠 높이 + X 고정이라 여기까지 못 간다. 새로 만들지 않고 prop으로 흡수한다.

- `fullHeight` — 시트를 화면 상단 여백만 남기고 채우고, 본문을 스크롤 영역으로 만든다
- 헤더 아이콘 선택(닫기/뒤로)
- 하단 고정 영역은 본문 바깥에 두어 `pb-safe`가 한 번만 걸리게 한다

기존 사용처(`TraceSourceSheet` 등)의 기본 동작은 바뀌지 않아야 한다.

## 8. 파일 변경

**신설**

- `_components/TraceWriteForm/TraceWriteForm.tsx` — ①
- `_components/TraceBookForm/TraceBookForm.tsx` — ③ 확인 화면
- `_components/BookSearchSheet/BookSearchSheet.tsx` — ③ 검색 시트
- `_components/TraceStepIndicator/TraceStepIndicator.tsx` — 브레드크럼 인디케이터(`1 생각 작성 › 2 문장 꾸미기 › 3 책 등록하기` + 닫기). 시안에는 기존 `TraceStepHeader`가 달던 **큰 제목이 없다** — 인디케이터가 그 자리를 대신하고 본문이 바로 이어진다
- `write/page.tsx`, `book/page.tsx`

**수정**

- `_services/traceStepNav.service.ts`, `_services/traceGuard.service.ts` — 스텝·가드
- `_components/TraceSourceSheet/TraceSourceSheet.tsx` — 책 배지
- `_components/OcrSelector/OcrSelector.tsx` — 도착지, 직접 입력 대안
- `_components/TraceDecorateForm/TraceDecorateForm.tsx` — 인터랙션 반전, `similar-check` 제거
- `_components/EffectPicker/EffectPicker.tsx` — 선택 상태
- `_hooks/useTextRangeSelection.ts` — 커밋 콜백
- `_components/BookSearchView/BookSearchView.tsx` — 시트 본문화, 후보 선택
- `_components/TraceSeedBoundary/TraceSeedBoundary.tsx` — 책만 소비
- `app/_shared/trace/_data/traceSeed.model.ts` — 타입 축소
- `app/(app)/trace/[id]/_components/TraceCollapseView/TraceCollapseView.tsx` — 씨앗 호출부
- `app/_global/_components/BottomSheet/BottomSheet.tsx` — 확장

**삭제**

- `_components/BookPicker/BookPicker.tsx` (역할 소멸)
- `_components/TraceDetailForm/TraceDetailForm.tsx`, `_components/TraceOpinionForm/TraceOpinionForm.tsx` (①로 흡수)
- `detail/page.tsx`, `opinion/page.tsx`
- `_components/TraceStepHeader/TraceStepHeader.tsx` (인디케이터로 교체)

## 9. 테스트

기존 spec 중 `traceStepNav` · `traceGuard` · `traceStepNavigation` · `bookPicker` · `traceSeed` · `traceDoneNavigation`이 새 순서를 따라 갱신된다. 새로 잠글 것은 다음과 같다.

| 무엇                                                | 왜                                         |
| --------------------------------------------------- | ------------------------------------------ |
| 씨앗이 책만 소비하고 시트에 배지가 뜬다             | 대목까지 물고 오던 동작이 사라진 것을 고정 |
| ①이 페이지·스포일러·의견을 함께 담는다              | 두 화면을 합친 자리라 한쪽이 누락되기 쉽다 |
| ②에서 효과를 고르지 않고 드래그하면 적용되지 않는다 | 반전한 인터랙션의 핵심 분기                |
| ②에서 효과 선택 후 드래그하면 그 효과로 적용된다    | 위와 짝                                    |
| ③에서 책 선택 직후 병합 검사가 돈다                 | 검사 시점이 옮겨간 것을 고정               |
| ③에서 책 카드를 탭하면 검색 시트가 다시 열린다      | 책 교체 경로                               |
| 저장 실패(401 · 병합 대상 소멸) 처리가 유지된다     | 로직이 화면을 옮겨 다니며 빠지기 쉬운 자리 |

## 10. 범위

**단계를 쪼개 나눠 배포할 수 없다.** 스텝 순서 자체가 바뀌므로 절반만 적용하면 가드가 어긋나 플로우가 끊긴다. 구현은 커밋을 나누더라도 하나의 브랜치에서 한 번에 전환한다. 다만 `BottomSheet` 확장(7절)은 기존 사용처의 동작을 바꾸지 않으므로 먼저 넣고 검증할 수 있다.

## 11. 미결·가정

- ②(문장 꾸미기) 시안이 없어 기존 레이아웃을 유지한다. 시안이 나오면 레이아웃만 맞추면 되도록 인터랙션과 뷰를 섞지 않는다.
- ③ 확인 화면의 의견 표시는 5절에서 정한 안을 따른다. 디자인이 확정되면 그 컴포넌트만 교체한다.
- 페이지 상한을 클라이언트에서 막지 않으므로, 서버가 범위 초과를 거절하는 경우의 메시지를 등록 실패 처리에 포함한다.

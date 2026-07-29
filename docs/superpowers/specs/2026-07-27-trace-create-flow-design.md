# 흔적 남기기 플로우 설계

날짜: 2026-07-27
이슈: [#34](https://github.com/Nexters/pallang-client/issues/34)
브랜치: `feat/34-trace-create-flow` (base: `develop` @ 423be0c)
API 스펙: https://api-dev.pallang.co.kr/v3/api-docs

## 목표

`/trace/new`에서 시작해 **책 선택 → 대목 입력(직접/사진 OCR) → 페이지·스포일러 → 꾸미기 → 병합 확인 → 의견 작성 → 완료**까지 관통하는 흔적 작성 플로우를 구현한다.

중간 저장 API가 없으므로 최종 저장은 `POST /api/opinions` 단일 호출로 Passage + Opinion + Decoration을 원자적으로 생성한다. 따라서 플로우 전 구간의 입력을 클라이언트가 통째로 들고 가는 것이 이 설계의 중심 문제다.

## 전제

- `develop`(423be0c) 기준. orval 생성 클라이언트(`app/_global/_apis/_generated/**`)와 mutator `customFetch.api.ts`가 이미 있다. API 레이어를 새로 짜지 않는다.
- `TabBar`의 '흔적 남기기' 버튼이 이미 `traceHref = '/trace/new'`를 가리킨다. 진입점 추가 작업이 없다.
- `app/trace/[id]`(흔적 보기)가 이미 있다. `app/trace/new`는 static 세그먼트라 dynamic보다 우선 매칭되어 충돌하지 않는다.
- 인증은 JWT Bearer이며 로그인은 네이티브 카카오 SDK 선행이 필요하다. 이번 범위는 **토큰 라이프사이클만**이고 로그인 화면·약관·온보딩은 제외한다.
- dev DB가 비어 있다(`GET /books/popular` → `totalElements: 0`). 빈 상태가 개발 중 기본 경로다.

## 결정 사항

| 결정                                 | 근거                                                                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 스텝을 라우트 세그먼트로 분리        | 스와이프 백·안드로이드 하드웨어 백이 별도 처리 없이 "이전 스텝"이 된다. App Router는 세그먼트 이동에서 layout을 remount하지 않으므로 Provider 하나로 상태가 유지된다 |
| 상태는 `Context + useReducer`        | zustand 미설치. 새 의존성 없이 충분하다                                                                                                                              |
| 효과는 3종만 활성                    | API `effectType` enum이 `UNDERLINE / WAVY / HIGHLIGHT` 뿐. 시안의 동그라미·점선·겹줄은 대응 값이 없다                                                                |
| 효과 범위 겹침 금지                  | 새 선택이 기존 범위와 겹치면 기존 것을 **교체**한다. 렌더링이 단순 분할로 끝나고, 서버가 겹침 검증을 하지 않으므로 프론트에서 데이터를 정리한다                      |
| 페이지 번호 필수                     | API에서는 optional이지만 `GET /books/{bookId}/passages`의 노출 필터가 페이지 기반이라, 비우면 그 대목이 어디에도 걸리지 않는다                                       |
| 의견 300자 제한                      | 시안 기준. API는 500이므로 더 엄격한 쪽이라 안전하다                                                                                                                 |
| `similar-check` 실패는 무시하고 진행 | 편의 기능이다. 여기서 막으면 이미 작성이 끝난 흔적이 인질이 된다                                                                                                     |
| `POST /opinions` 실패 시 draft 보존  | 페이지·효과·의견을 모두 입력한 뒤라 유실 비용이 가장 크다                                                                                                            |
| OCR 선택은 **블록 단위**             | `TextBlock.boundingBox`가 블록 단위로만 오고 글자 단위 좌표가 없다                                                                                                   |

## 구성

### 0. 선행 작업

**0-1. `pnpm api:gen` 재실행.** 현재 커밋된 생성물은 스펙에 `required` 배열이 추가되기 **전** 시점의 것이다. `BookResponse.bookId?: number`, `TextBlock.text?: string`, `Point.x?: number`처럼 실제로는 항상 오는 값이 전부 optional로 잡혀 있어 사용부에 불필요한 널 가드가 번진다. 재생성하면 대부분 required로 좁혀진다.

`_generated` diff가 크므로 **별도 커밋으로 분리**한다.

**0-2. `customFetch`의 FormData 버그 수정.** 현재 구현은 이렇다.

```ts
if (options.body != null && !headers.has('Content-Type')) {
  headers.set('Content-Type', 'application/json') // ← FormData에도 붙는다
}
```

`createOcrResult`는 `body: formData`를 Content-Type 없이 넘기므로 여기서 `application/json`이 붙고 **multipart boundary가 사라져 사진 경로가 시작부터 400으로 죽는다.**

```ts
const isFormData = options.body instanceof FormData
if (options.body != null && !isFormData && !headers.has('Content-Type')) {
  headers.set('Content-Type', 'application/json')
}
```

`customFetch.api.ts`는 생성물이 아닌 수동 파일이라 수정 대상이 맞다.

### 1. 라우트 구조

```
app/trace/new/layout.tsx                TraceDraftProvider + 스텝 가드
app/trace/new/page.tsx                  책 선택 · BottomSheet 2종
app/trace/new/photo/page.tsx            사진 → OCR → 블록 드래그 선택
app/trace/new/detail/page.tsx           1/3 페이지 + 스포일러
app/trace/new/decorate/page.tsx         2/3 꾸미기 (+ 병합 다이얼로그)
app/trace/new/opinion/page.tsx          3/3 의견 작성
app/trace/new/done/page.tsx             완료
```

`app/trace`는 `eslint-plugin-boundaries` 기준 feature 하나이므로 `new/`와 `[id]/`는 서로 import가 허용된다. 다만 뷰어 코드는 이번에 건드리지 않으며, 실제 공유가 필요해질 때 `app/_shared/passage/`로 승격한다.

### 2. draft 상태

`app/trace/new/_types/traceDraft.type.ts`

```ts
type SelectedBook = {
  bookId: number
  title: string
  author: string
  coverImageUrl: string | null
  pageCount: number | null
}

type DraftDecoration = {
  startOffset: number
  endOffset: number // exclusive (§7 참고)
  effectType: DecorationRequestEffectType
  color: string
}

type TraceDraft = {
  book: SelectedBook | null
  source: 'manual' | 'photo' | null
  quotedText: string // ≤150
  pageNumber: number | null
  isSpoiler: boolean
  decorations: DraftDecoration[] // 저장 시 ≥1
  content: string // ≤300
  passageId: number | null // 병합 선택 시에만
  result: { opinionId: number; merged: boolean } | null
}
```

`app/trace/new/_data/traceDraft.store.ts`에 `initialTraceDraft`와 reducer를 둔다. 액션은 `selectBook` / `setSource` / `setQuotedText` / `setPageDetail` / `applyDecoration` / `removeDecoration` / `setContent` / `setMergeTarget` / `setResult` / `resetKeepingBook` / `reset`.

`applyDecoration`은 기존 `decorations` 중 새 범위와 겹치는 항목을 제거한 뒤 추가한다(겹침 금지 정책).

Provider는 `app/trace/new/_components/TraceDraftProvider/TraceDraftProvider.tsx`, 접근 훅은 `_hooks/useTraceDraft.ts`.

**가드** (`_hooks/useTraceGuard.ts`, layout에서 호출)

| 라우트                | 최소 요건                   | 미달 시               |
| --------------------- | --------------------------- | --------------------- |
| `/trace/new`          | —                           | —                     |
| `/trace/new/photo`    | `book`                      | `/trace/new`          |
| `/trace/new/detail`   | `book` + `quotedText`       | `/trace/new`          |
| `/trace/new/decorate` | + `pageNumber`              | `/trace/new/detail`   |
| `/trace/new/opinion`  | + `decorations.length >= 1` | `/trace/new/decorate` |
| `/trace/new/done`     | `result`                    | `/trace/new`          |

새로고침·딥링크로 빈 draft에 떨어지는 경우가 이 한 겹으로 막힌다. 이미지 blob과 OCR 결과는 메모리에만 있으므로 복구하지 않는다.

### 3. `_queries` 추가

생성 함수를 감싸기만 한다. `app/_global/_queries/book.queries.ts`에 추가하고, `passage.queries.ts` / `opinion.queries.ts`는 신규 생성한다.

```ts
// book.queries.ts — 기존 bookQueries에 추가
recent: (params?: GetRecentBooksParams) =>
  queryOptions({
    queryKey: [...bookQueries.all(), 'recent', params ?? {}],
    queryFn: () => getRecentBooks(params),
  }),
internalSearch: (params: SearchInternalBooksParams) =>
  queryOptions({
    queryKey: [...bookQueries.all(), 'internal-search', params],
    queryFn: () => searchInternalBooks(params),
    enabled: params.keyword.trim().length > 0,
  }),
```

```ts
// passage.queries.ts
export const passageMutations = {
  ocr: () => mutationOptions({ mutationKey: ['passage', 'ocr'], mutationFn: createOcrResult }),
  similarCheck: () =>
    mutationOptions({
      mutationKey: ['passage', 'similar-check'],
      mutationFn: checkSimilarPassages,
    }),
}

// opinion.queries.ts
export const opinionMutations = {
  create: () => mutationOptions({ mutationKey: ['opinion', 'create'], mutationFn: createOpinion }),
}
```

invalidation·navigation 같은 side effect는 사용부에서 처리한다(`.agents/tanstack-query.md`).

### 4. 인증 토큰 라이프사이클

`customFetch.api.ts`에 이미 `setAccessTokenGetter`와 `TODO(auth)` 주석이 심으로 박혀 있다. 그 뒤를 채운다.

- `app/_global/_data/authToken.store.ts` — `accessToken` / `refreshToken`의 localStorage 읽기·쓰기·삭제
- `app/_global/_apis/authRefresh.api.ts` — `POST /api/auth/refresh` 호출과 단일 in-flight 공유
- `customFetch` 확장 — 기본 토큰 getter가 `authToken.store`를 직접 읽는다. 401이고 refreshToken이 있으면 재발급 1회 후 원 요청 재시도. 재발급 실패 시 토큰을 폐기하고 `ApiError`를 그대로 전파

**Provider를 두지 않는다.** `eslint.config.mjs`의 `no-restricted-imports`가 `**/_apis/**` import를 `_global/_queries` · `_global/_apis` · `_global/_tests` 밖에서 금지하므로 `_providers`나 `_services`에서 `customFetch.api`를 참조할 수 없다. 토큰 주입을 `customFetch` 안쪽으로 내리면 등록 시점을 잡을 Provider 자체가 불필요해진다.

같은 이유로 `authRefresh.api.ts`는 생성된 `refresh()`를 쓰지 않고 맨 `fetch`로 엔드포인트를 직접 호출한다. `_generated/auth/auth.ts`가 `customFetch`를 import하므로 그쪽을 참조하면 `import/no-cycle`에 걸린다.

**리프레시 토큰이 회전식(사용 즉시 폐기)이라 재발급은 단일 in-flight Promise로 공유해야 한다.** 동시 401이 두 건 나면 각자 재발급을 시도하다 서로의 토큰을 무효화한다. `refresh` 호출 자체의 401은 재시도하지 않는다(무한 루프 방지).

카카오 로그인이 붙기 전까지는 `NEXT_PUBLIC_DEV_ACCESS_TOKEN` / `NEXT_PUBLIC_DEV_REFRESH_TOKEN` env가 있으면 localStorage가 비었을 때 초기값으로 주입한다. `.env.example`과 `env.d.ts`에 키를 문서화하고, 로그인 구현 시 제거할 임시 장치임을 주석으로 남긴다.

### 5. 공용 컴포넌트 (`app/_global/_components/`)

| 컴포넌트           | 용도                                           | 비고                            |
| ------------------ | ---------------------------------------------- | ------------------------------- |
| `BottomSheet`      | 저장 방식 선택, 직접 입력                      | 오버레이 + 하단 시트, 제목/닫기 |
| `Dialog`           | 병합 확인                                      | 중앙 모달                       |
| `Snackbar`         | "영역 선택 후 효과를 입력해주세요!", 저장 실패 | 자동 소멸 + 닫기                |
| `SegmentedControl` | 스포일러 없어요/있어요                         | 2택 토글                        |

기존 `Button`(`back` / `activated` / `disabled`)과 `Textarea`(`light` 150자 / `dark` 300자)가 시안에 그대로 대응하므로 신규 제작하지 않는다.

`app/trace/[id]/_components/LoginGateModal`은 `Dialog` 없이 인라인으로 구현되어 있지만 이번 범위에서는 건드리지 않는다.

### 6. 대목 카드와 효과 렌더링

`app/trace/new/_components/TraceNote/TraceNote.tsx` — 크림색 카드에 `quotedText`와 효과를 그린다. 1/3·2/3·3/3 세 화면에서 재사용한다. 스타일 토큰은 뷰어의 `HighlightCard`(`bg-bg-book-card`, `border-border-book`)를 따른다. 병합 다이얼로그는 시안상 크림 카드가 아니라 회색 텍스트 박스 두 개이므로 `TraceNote`를 쓰지 않는다.

효과 렌더링은 순수 함수로 분리한다 — `app/trace/new/_services/decoration.service.ts`

```ts
type TextSegment = { text: string; decoration: DraftDecoration | null }

export function splitByDecorations(text: string, decorations: DraftDecoration[]): TextSegment[]
```

`startOffset` 오름차순으로 정렬해 경계마다 잘라낸다. 겹침은 입력 단계에서 제거되지만, 방어적으로 앞 조각과 겹치는 항목은 건너뛴다.

효과 목록은 `app/trace/new/_data/effect.constant.ts` 한 곳에 모은다.

```ts
export const EFFECT_OPTIONS = [
  { key: 'highlight', label: '형광펜', effectType: 'HIGHLIGHT', color: '#FFE08A' },
  { key: 'wavy', label: '물결줄', effectType: 'WAVY', color: '#EF5A06' },
  { key: 'circle', label: '동그라미', effectType: null, color: '#EF5A06' },
  { key: 'pencil', label: '색연필', effectType: 'UNDERLINE', color: '#EF5A06' },
  { key: 'dotted', label: '점선', effectType: null, color: '#EF5A06' },
  { key: 'double', label: '겹줄', effectType: null, color: '#EF5A06' },
] as const
```

시안의 3×2 그리드 순서를 그대로 유지하되 `effectType: null`인 항목은 비활성으로 렌더한다. 백엔드가 enum을 넓히면 이 파일에서 값만 채우면 열린다. 색상 선택 UI는 시안에 없으므로 효과별 고정 색을 쓴다.

### 7. 범위 선택 (`TextRangeSelector`)

네이티브 `window.getSelection()`은 모바일 웹뷰에서 파란 핸들과 복사 메뉴가 함께 떠 시안과 맞지 않는다. 직접 구현한다.

- `Array.from(quotedText)`로 쪼개 각 문자를 `<span data-offset={i}>`로 렌더
- `pointerdown`에서 시작 offset, `pointermove`에서 `document.elementFromPoint`로 현재 offset, `pointerup`에서 확정
- `touch-action: none` + `setPointerCapture`로 스크롤 제스처와 분리
- 결과는 `{ startOffset, endOffset }`

**offset 규약: `endOffset`은 exclusive(JS `slice` 관례)로 간다.** API 예시(`startOffset: 3, endOffset: 12`)만으로는 판별되지 않는다. 뷰어에서 저장된 흔적을 그릴 때 한 글자씩 밀리는지로 검증하고, 어긋나면 백엔드와 맞춘다.

offset은 JS 문자열 인덱스(UTF-16 code unit) 기준이다. 한글은 BMP 안이라 안전하지만 서로게이트 페어(이모지)가 섞이면 `Array.from` 인덱스와 어긋난다. 대목은 책 인용문이라 발생 가능성이 낮다고 보고 다루지 않는다.

### 8. 사진 → OCR 경로

1. `/trace/new`의 BottomSheet에서 '사진으로 입력' → `useCamera().takePhoto()`. Capacitor의 `CameraSource.Prompt`가 카메라/앨범 선택 모달을 네이티브로 띄우므로 별도 모달을 만들지 않는다.
2. `webPath`를 `fetch(webPath).then((r) => r.blob())`으로 변환한다. 기존 `useCamera`는 `webPath`만 돌려주므로 blob 변환을 훅에 추가한다.
3. `createOcrResult({ image: blob })` 호출.
4. 응답 `blocks[]`를 이미지 위에 `boundingBox.vertices` 폴리곤으로 오버레이하고, 드래그로 블록을 선택한다.
5. 선택된 블록의 `text`를 문서 순서로 이어붙여 `quotedText`를 만든다. `lineBreak`가 `true`인 블록 뒤에는 공백 대신 줄바꿈을 넣는다.
6. 150자를 넘으면 잘라내고 스낵바로 알린다.

`ocrText.service.ts`가 4~6의 좌표·텍스트 변환을 순수 함수로 담당한다.

`POST /api/opinions` 설명에 _"OCR 입력은 별도 플로우"_ 라고 적혀 있고 전용 API가 준비 중이다. 다만 `OcrRecognize` 응답에 이미지 ID나 passage ID 같은 서버 측 참조가 전혀 없어 현재로선 저장 페이로드가 직접 입력과 동일하다. **사진 경로도 `opinionMutations.create()`를 그대로 쓰되, 교체 지점을 이 한 곳으로 국한한다.**

### 9. 병합

`/trace/new/decorate`의 `다음`에서 `checkSimilarPassages({ bookId, pageNumber, quotedText })`를 호출한다. 후보가 있으면 `MergeDialog`를 띄우고, 없으면 바로 `/trace/new/opinion`으로 보낸다.

- `합칠게요` → `setMergeTarget(candidate.passageId)`
- `따로 남길게요` → `passageId`를 `null`로 유지

두 경우 모두 `/trace/new/opinion`으로 진행한다. 후보가 여럿이면 첫 번째를 보여준다(시안이 1:1 비교 형태다).

### 10. 에러 처리

`ApiError`는 `status`와 `code`(`ErrorResponse.title`)를 보존하므로 `detail` 문자열을 파싱하지 않고 코드로 분기한다.

| 상황                                                        | 처리                                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| OCR 400 / 422 / 503                                         | `/trace/new/photo`에 머물며 다시 찍기 유도                                                |
| `similar-check` 실패 (모든 코드)                            | 조용히 병합을 건너뛰고 `/trace/new/opinion`으로 진행                                      |
| `POST /opinions` 실패                                       | **draft 유지**, 3/3에 머물며 스낵바                                                       |
| `PASSAGE_400_2` (도서 불일치) / `PASSAGE_404_1` (대목 없음) | 병합 대상이 사라진 경우다. `passageId`를 비우고 재시도를 안내                             |
| 401                                                         | 재발급 1회 시도 후 실패하면 로그인 필요 상태. 로그인 화면이 없으므로 개발자용 문구로 구분 |
| 카메라 취소 (`takePhoto()` → `null`)                        | 에러가 아니다. 아무 일도 하지 않는다                                                      |

## 검증

- `pnpm lint && pnpm typecheck && pnpm test` 통과
- 단위 테스트
  - `traceDraft.store` — 스텝 전이, 겹치는 범위 적용 시 기존 항목 교체
  - `decoration.service` — 경계·인접·빈 배열·겹침 방어
  - `ocrText.service` — 블록 순서 결합, `lineBreak` 처리, 150자 절단
  - `authToken.service` — 동시 401에서 재발급이 한 번만 일어나는지
  - `customFetch` — FormData일 때 Content-Type을 붙이지 않는지 (기존 `_tests/customFetch.spec.ts`에 추가)
- 컴포넌트 테스트 — `SegmentedControl`, `BottomSheet`
- Storybook — `BottomSheet`, `Dialog`, `Snackbar`, `SegmentedControl`, `TraceNote`(효과 조합별), `EffectPicker`
- 수동 확인 — `/trace/new`에서 직접 입력 경로를 완주해 실제로 저장되는지. 웹뷰 확인은 `pnpm build && pnpm start` 기준(`docs/capacitor.md`)

## 리스크

1. **OCR 블록 입도 미확인.** `TextBlock`이 단어 단위인지 줄 단위인지 실 데이터로 확인해야 한다. 문단 단위로 오면 "드래그로 원하는 대목만 선택"이 사실상 불가능해져 UI를 다시 잡아야 한다.
2. **offset exclusive/inclusive 규약 미확인** (§7).
3. **dev DB가 비어 있다.** `recent` / `internal-search`가 빈 결과라 플로우를 끝까지 돌리려면 책 데이터 시드가 필요하다.
4. **CORS.** 백엔드가 열어주기로 했으나 `X-Debug-User-Id`가 아닌 `Authorization`과, OCR의 `multipart/form-data` `Content-Type`이 `Access-Control-Allow-Headers`에 포함되어야 한다.
5. **포인터 드래그 테스트**는 happy-dom에서 좌표 기반이라 `getBoundingClientRect` / `elementFromPoint` 모킹이 필요하다.
6. **`pnpm api:gen` 재실행 시 `_generated` diff가 크다.** 별도 커밋으로 분리한다.

## 스킵한 것 (필요해지면 추가)

- 카카오 로그인 화면, 약관 동의, 온보딩 — 네이티브 SDK 선행 필요. 토큰 라이프사이클만 구현한다
- 외부(알라딘) 도서 검색, 도서 직접 등록 — 검색해도 없는 책의 탈출구가 필요해지면 추가
- 동그라미·점선·겹줄 효과 — 백엔드 `effectType` enum 확장 후
- 효과 색상 선택 UI — 시안에 없다. 효과별 고정 색
- draft 임시저장·복구 — 새로고침 시 소실을 허용한다. 이미지 blob이 메모리에만 있어 어차피 완전 복구가 불가능하다
- 뷰어(`app/trace/[id]`)의 목 데이터 → 실 API 전환 — 이슈 #32의 범위

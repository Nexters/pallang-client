# 흔적 작성 뒤로가기 재설계 · 도서 직접 추가 설계

날짜: 2026-07-30
이슈: [#94](https://github.com/Nexters/pallang-client/issues/94) (뒤로가기) · [#95](https://github.com/Nexters/pallang-client/issues/95) (도서 직접 추가)
브랜치: `fix/94-trace-new-back-nav` → 이어서 `feat/95-book-direct-add` (base: `develop` @ 8483c29)
API 스펙: https://api-dev.pallang.co.kr/v3/api-docs
Figma: [책검색_03_추가하기_01_default](https://www.figma.com/design/4ffaEtjCoV2r2P2ZCVLOls/?node-id=2260-9660) (`2260:9660`)

## 목표

두 가지를 함께 해결한다.

1. **뒤로가기가 먹지 않는 문제.** `/trace/new` 플로우에서 히스토리 기반 `router.back()`과 상태 기반 `TraceStepGuard`의 `router.replace()`가 서로 싸워, 뒤로가기를 눌러도 화면이 그대로이거나 여러 번 눌러야 빠져나온다.
2. **책 직접 추가.** 검색 결과에 없는 책을 사용자가 등록해 그대로 흔적 작성을 이어갈 수 있게 한다. 알라딘 외부 검색으로 메타데이터를 채운다.

두 작업은 독립이 아니다. 도서 추가 화면이 흔적 작성 플로우 안에 들어가므로 1번의 단계·히스토리 정책이 2번의 화면 배치를 결정한다.

## 문제 진단 (1번)

현재 히스토리 스택은 이렇게 쌓인다.

```
/  →push→  /trace/new  →push→  /photo  →push→  /detail  →push→  /decorate  →push→  /opinion  →replace→  /done
```

각 화면의 "뒤로"는 전부 `router.back()`이고(`BookPicker.tsx:113`, `TraceDetailForm.tsx:87`, `TraceDecorateForm.tsx:161`, `TraceOpinionForm.tsx:111`, `OcrSelector.tsx:74,178`), `resolveGuardRedirect`는 draft 상태와 맞지 않는 경로를 `replace`로 되돌린다. 그래서:

| 재현 경로                          | 실제 동작                                                                                                                                     |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| done에서 하드웨어 back             | decorate로 갔다가 `draft.result !== null`이라 guard가 done으로 `replace`. 화면은 제자리. 스택 5칸이 쌓여 있어 **back을 5번** 눌러야 홈에 닿음 |
| done → "흔적 남기기" → 뒤로 화살표 | `resetKeepingBook`으로 `result`가 null이 된 done으로 돌아가 guard가 다시 `/trace/new`로 `replace`. **완전히 제자리**                          |
| detail에서 "뒤로"                  | `/photo` 리마운트 → `OcrSelector`가 마운트 즉시 `takePhoto()` 호출(`OcrSelector.tsx:117-121`) → **뒤로 눌렀는데 카메라가 열림**               |

근본 원인은 "뒤로가기 = 히스토리 한 칸"과 "화면 유효성 = draft 상태"라는 두 진실이 공존하는 것이다. 스택은 임의로 삭제할 수 없으니, 히스토리를 **플로우당 한 칸으로 고정**하고 단계 이동을 상태로만 표현하면 두 진실이 하나가 된다.

## 전제

- 뒤로가기 수단은 **화면 내 버튼**과 **Android 하드웨어 back** 둘뿐이다. `capacitor.config.ts`에 iOS 스와이프 back 설정이 없어 WKWebView 기본값(비활성)이다.
- `draft`는 `useReducer` 메모리 상태다(`TraceDraftProvider.tsx:12`). 플로우를 벗어나면 사라지고 새로고침에도 사라진다. 이 설계는 persist를 도입하지 않는다.
- `@capacitor/app`은 미설치다. 하드웨어 back 인터셉트를 위해 추가하고 `npx cap sync`가 필요하다.
- 이미지 업로드 엔드포인트가 서버에 없다. 전체 엔드포인트 목록에 `POST /api/passages/ocr`(multipart)만 있고 범용 업로드가 없다.
- `POST /api/books`는 **인증 불필요**이며 `coverImageUrl`을 문자열로만 받는다.
- `GET /api/books/search`(알라딘)는 `title/author/publisher/isbn/coverImageUrl`만 주고 **`bookId`와 `pageCount`가 없다**. 스펙 주석: _"응답 속도를 위해 pageCount는 내려주지 않으며, 등록 시 사용자가 직접 입력합니다."_

## 결정 사항

| 결정                                   | 근거                                                                                                                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 플로우 = 히스토리 1칸                  | 스택을 임의로 지울 수 없다. 전진·후진을 모두 `replace`로 만들면 guard의 `replace`와 충돌할 대상 자체가 사라진다                                                 |
| 단계 그래프를 서비스로 분리            | "이전 단계"가 순수 함수가 되어 테스트 가능해진다. 화면 컴포넌트가 `router.back()`을 직접 부르지 않는다                                                          |
| detail·photo의 뒤로는 `search`로       | `/photo` 재진입은 카메라를 다시 여는 것 말고 할 수 있는 일이 없다(사진·OCR 블록을 draft에 보관하지 않는다). 방식 선택 시트로 되돌리면 사진/직접입력 전환도 된다 |
| 뒤로 이동 시 `clearQuote`              | BookPicker의 시트 자동 오픈 조건이 `draft.book && !draft.quotedText`다. 대목을 비워야 방식 선택 시트가 다시 열린다                                              |
| 이탈 확인을 상태 판정 함수로           | X 버튼과 하드웨어 back이 같은 규칙을 쓰게 만든다. 시트만 닫기 / 바로 나가기 / 확인 다이얼로그가 draft와 오버레이 상태로 결정된다                                |
| 내부·외부 검색을 **둘 다** 쓴다        | 외부 결과에는 `bookId`가 없어 흔적을 남길 수 없다. 외부만 쓰면 이미 등록된 책도 매번 등록 절차를 밟고, 같은 책이 여러 레코드로 갈라져 흔적이 흩어진다           |
| 외부 검색은 내부 결과 0건일 때만       | 요청 낭비가 없고, 내부 목록이 무한스크롤이라 하단 섹션은 사실상 보이지 않는다. 기존 빈 상태 문구(`BookPickList.tsx:63`)와 그대로 이어진다                       |
| 페이지 수는 **필수**                   | Figma에서 `*` 표시다. `POST /api/books`에서는 optional이지만 `pageNumber` 상한 검사(`TraceDetailForm`)가 `pageCount`에 의존한다. 알라딘도 주지 않는 값이다      |
| 커버 이미지는 프리필 표시 전용         | 업로드 API가 없다. Figma의 "책 이미지를 등록해주세요" 박스는 비활성 플레이스홀더로 두고, 알라딘 프리필이 있으면 그 커버를 보여준다                              |
| 도서 추가 폼을 라우트가 아닌 뷰 상태로 | 알라딘에서 고른 값을 폼으로 넘길 때 라우트 경계를 넘지 않아 상태 상자가 불필요하다. 히스토리 1칸 정책과도 자연히 맞는다                                         |
| 공용 `Textfield` 신설                  | Figma `TextFiled` 인스턴스에 대응하는 공용 컴포넌트가 없다(`SearchTextfield`만 있다). 라벨·필수 표시·에러를 갖춘 디자인 시스템 요소다                           |

## Part 1 — 뒤로가기 재설계

### 1-1. 단계 그래프 (`_services/traceStepNav.service.ts`)

경로 ↔ 단계 매핑과 "이전 단계"를 순수 함수로 정의한다.

```ts
export type TraceStep = 'search' | 'photo' | 'detail' | 'decorate' | 'opinion' | 'done'

export type TraceBackTarget =
  | { type: 'exit' } // 플로우를 벗어난다
  | { type: 'step'; step: TraceStep; clearQuote: boolean }

resolveStep(pathname): TraceStep | null
stepPath(step): string
resolveBackTarget(step): TraceBackTarget
```

| 현재 단계  | 이전                       |
| ---------- | -------------------------- |
| `search`   | `exit` (홈)                |
| `photo`    | `search` + `clearQuote`    |
| `detail`   | `search` + `clearQuote`    |
| `decorate` | `detail`                   |
| `opinion`  | `decorate`                 |
| `done`     | `exit` (홈, draft `reset`) |

### 1-2. 모든 단계 이동을 `replace`로

- 플로우 **진입만 `push`**: `TabScreenLayout.tsx:44`, `TabBar`의 `traceHref`.
- 전진(`photo` / `detail` / `decorate` / `opinion` / `done`)·후진·`done`→"흔적 남기기" 전부 `router.replace`.
- 플로우 이탈(`exit`)도 `router.replace('/')`로 통일한다. `router.back()`을 쓰면 딥링크로 `/trace/new`에 직접 들어온 경우 돌아갈 자리가 없고, `push`를 쓰면 홈이 스택에 두 번 쌓인다.
- 결과 히스토리는 항상 `/ → /trace/new/<현재 단계>` 2칸이다. 어느 단계에서 하드웨어 back을 눌러도 한 번에 홈으로 나간다.

`_hooks/useTraceStepNav.ts`가 `goNext(step)` / `goBack()` / `exit()`를 제공하고, 각 화면은 `router`를 직접 만지지 않는다.

### 1-3. `clearQuote` 액션

```ts
case 'clearQuote':
  return { ...state, quotedText: '', decorations: [], pageNumber: null, passageId: null }
```

`source`와 `book`은 남긴다. `photo`/`detail`에서 뒤로 오면 대목이 비워져 `BookPicker`가 방식 선택 시트를 자동으로 연다. **결과적으로 detail에서 뒤로 = 대목 재선택**이며, 이는 의도된 동작이다.

### 1-4. 이탈 판정 (`_services/traceExit.service.ts`)

```ts
export type TraceExitDecision = 'closeOverlay' | 'exit' | 'confirm'

resolveExitDecision({ step, hasOverlay, draft }): TraceExitDecision
```

| 상황                                                              | 판정           |
| ----------------------------------------------------------------- | -------------- |
| 시트·다이얼로그가 열려 있거나 `search` 단계의 폼 뷰(`hasOverlay`) | `closeOverlay` |
| `done` 단계                                                       | `exit`         |
| 대목·꾸밈·의견이 모두 비어 있음(책만 고름)                        | `exit`         |
| 그 외 (작성 중)                                                   | `confirm`      |

`hasOverlay`는 화면이 "지금 닫을 수 있는 겹친 층"을 갖고 있는지를 뜻한다. `BookPicker`의 `view === 'form'`, 열린 시트(`TraceSourceSheet`/`ManualQuoteSheet`/`OcrQuoteSheet`), `MergeDialog`가 모두 여기에 해당하고, 판정이 `closeOverlay`면 그 층만 한 칸 걷어낸다.

`confirm`이면 공용 `Dialog`로 "지금 나가면 작성 중이던 흔적이 사라져요"를 띄우고, 확인 시 `reset` + 홈으로.

호출 지점 두 곳이 같은 판정을 쓴다.

- `TraceStepHeader`의 닫기 X (현재 `router.push('/')` 직행)
- Android 하드웨어 back

### 1-5. 하드웨어 back 인터셉트

`_hooks/useHardwareBack.ts` — `@capacitor/app`의 `App.addListener('backButton', ...)`를 붙인다. 웹 브라우저에서는 리스너가 붙지 않고(플러그인 미구현 플랫폼) 브라우저 back이 그대로 동작하는데, 스택이 2칸이라 홈으로 나가는 것이 기대 동작과 같다.

```
pnpm add @capacitor/app
npx cap sync
```

`docs/capacitor.md`에 플러그인 추가 사실과 재설치 필요성을 적는다.

### 1-6. guard 정리

`resolveGuardRedirect`의 규칙 자체는 유지한다. `replace` 기반이 되면서 done 엔트리가 스택에 남지 않아 "guard가 되돌린 화면으로 다시 back" 루프가 발생하지 않는다. `pathname !== START` 예외(첫 화면은 막지 않음)도 그대로 둔다.

## Part 2 — 도서 직접 추가

### 2-1. 검색: 내부 우선 + 외부 폴백

`book.queries.ts`에 추가한다.

```ts
searchExternal: (params: SearchExternalBooksParams) => queryOptions({...})   // 단일 페이지 20건
```

```ts
bookMutations = {
  create: () => mutationOptions({ mutationFn: (data: CreateBookRequest) => createBook(data) }),
}
```

- 내부 검색은 현행 유지(무한스크롤, `keepPreviousData`).
- 외부 검색은 `enabled: isSearching && !isTypingAhead && 내부 결과 0건`. 디바운스가 끝나고 내부 결과가 비었을 때만 요청한다.
- 외부 섹션 헤더: "팔랑에 아직 없는 책이에요". 항목을 탭하면 그 값으로 폼을 프리필한다.
- 섹션 하단에 "직접 추가하기" 버튼 → 빈 폼. 검색바 옆 `onAddBook` 버튼(현재 `disabled`)도 같은 빈 폼으로 연결한다.
- 외부 셀은 대목·흔적 수가 없다. `BookItem`의 `opinionCount`/`passageCount`를 optional로 바꾸고, 없으면 배지를 렌더하지 않는다. `/book/internal`과 `BookPickList` 사용처는 값을 그대로 넘기므로 영향이 없다.

### 2-2. 폼 (`BookAddForm`)

Figma `2260:9660` 구조를 따른다 — 상단 `navigation bar`(제목 "책 추가하기" + 닫기 X), `ImageUpload`, `InputList`(필드 5개), `ButtonArea`(저장하기).

| 필드      | 필수 | 비고                                      |
| --------- | ---- | ----------------------------------------- |
| 제목      | ✅   | `title`                                   |
| 지은이    | ✅   | `author`                                  |
| 출판사    | ✅   | `publisher`                               |
| 페이지 수 | ✅   | `pageCount`, 1 이상 정수, 숫자 키패드     |
| ISBN      | —    | `isbn`, 프리필 시 읽기 전용으로 두지 않음 |

유효성은 `_services/bookForm.service.ts`의 순수 함수로 뺀다(`validateBookForm(values) → { isValid, errors }`).

커버 영역: 프리필 `coverImageUrl`이 있으면 커버를 보여주고, 없으면 Figma 플레이스홀더 문구를 비활성 상태로 둔다(탭 불가). 업로드 API가 생기면 이 자리에 연결한다.

저장 흐름:

```
저장하기 → POST /api/books → dispatch({ type: 'selectBook', book }) → view: 'search' 복귀
         → BookPicker가 방식 선택 시트 자동 오픈 (기존 handleSelect 경로 재사용)
```

`selectBook`은 이미 `passageId`·`result`를 비우므로 새 흔적 시작으로 안전하게 이어진다.

실패 처리: 400이면 "이미 등록된 책일 수 있어요. 검색으로 찾아보세요" 스낵바를 띄우고 폼에 머문다. 그 외 실패는 "책을 등록하지 못했어요. 잠시 후 다시 시도해주세요".

> **백엔드 확인 필요**: 같은 ISBN을 다시 등록할 때 기존 도서를 반환하는지 400인지 스펙에 없다. dedupe라면 위 400 분기는 필요 없고 성공 응답의 `bookId`로 그대로 진행한다.

### 2-3. 컴포넌트 배치

```
app/trace/new/_components/
  BookPicker/         view: 'search' | 'form' 상태와 시트 조립만 남긴다
  BookSearchView/     기존 검색 UI(캐러셀·검색 목록·빈 상태) 이관
  ExternalBookList/   알라딘 폴백 섹션 + "직접 추가하기"
  BookAddForm/        추가 폼
app/trace/new/_services/
  bookForm.service.ts
  traceStepNav.service.ts
  traceExit.service.ts
app/trace/new/_hooks/
  useTraceStepNav.ts
  useHardwareBack.ts
app/_global/_components/Textfield/Textfield.tsx     라벨 + 필수 표시 + 에러
app/_global/_queries/book.queries.ts                searchExternal, bookMutations.create
app/_shared/book/_components/BookItem/BookItem.tsx  카운트 prop optional
```

`Textfield`는 구현 직전에 Figma `get_design_context`로 `TextFiled` 인스턴스(498×76) 스펙을 받아 토큰을 맞춘다.

## 테스트

| 파일                               | 검증                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------- |
| `_tests/traceStepNav.spec.ts`      | 경로↔단계 매핑, 각 단계의 이전 단계와 `clearQuote` 여부                    |
| `_tests/traceExit.spec.ts`         | 오버레이 열림 / done / 책만 고름 / 작성 중 네 갈래 판정                    |
| `_tests/traceGuard.spec.ts` (갱신) | 기존 규칙 유지 확인                                                        |
| `_tests/traceDraft.spec.ts` (갱신) | `clearQuote`가 `book`·`source`는 남기고 대목·꾸밈·페이지를 비운다          |
| `_tests/bookForm.spec.ts`          | 필수 3필드, 페이지 수 1 이상 정수, 공백만 입력 거부                        |
| `_tests/bookPicker.spec.tsx`       | 내부 0건 → 외부 섹션 렌더 / 등록 성공 → 방식 선택 시트 오픈 / 400 → 스낵바 |

## 범위 밖

- 커버 이미지 업로드 (서버 엔드포인트 필요 — 별도 이슈)
- `/book/internal`의 도서 추가 버튼 (흔적 플로우 복귀가 없어 성격이 다르다. 계속 비활성)
- `draft` persist (새로고침 복원)
- 내부 결과가 있을 때 다른 판본을 외부에서 찾는 경로

## 후속 확인 사항

1. `POST /api/books`의 ISBN 중복 응답 규약 (백엔드)
2. 커버 이미지 업로드 엔드포인트 추가 여부 (백엔드)
3. `@capacitor/app` 추가 후 Android 실기기에서 back 동작 검증 (`docs/capacitor.md` 절차)

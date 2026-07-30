# 도서 직접 추가 구현 계획 (#95)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**선행 조건:** `#94`(`docs/superpowers/plans/2026-07-30-trace-new-back-nav.md`)가 머지되어 있어야 한다. Task 6이 `useOverlayBackGuard`(#94 Task 4)를 사용한다.

**Goal:** 내부 검색에 없는 책을 알라딘 외부 검색으로 찾아 등록하고, 등록한 책으로 곧바로 흔적 작성을 이어가게 한다.

**Architecture:** 내부 검색은 그대로 두고, 결과가 0건일 때만 같은 키워드로 외부 검색을 실행해 폴백 섹션으로 보여준다. 외부 결과를 고르면 그 값이 채워진 등록 폼으로 전환하고(라우트가 아닌 `BookPicker`의 뷰 상태), 저장 성공 시 `selectBook`을 dispatch해 기존 방식 선택 시트 흐름으로 합류한다.

**Tech Stack:** Next.js App Router, TanStack Query (`queryOptions`/`mutationOptions`), Tailwind v4 토큰, Vitest + @testing-library/react

**설계 스펙:** `docs/superpowers/specs/2026-07-30-trace-new-nav-and-book-add-design.md`
**Figma:** `2260:9660` (책검색_03_추가하기_01_default)

## Global Constraints

- **default export 금지** — named export만. Next 특수 파일은 예외.
- **배럴 파일 금지**. 같은 route 내부는 상대경로, `_shared`/`_global`은 `@/` 절대경로.
- 컴포넌트 파일은 컴포넌트 하나만 export. 내부 헬퍼는 export하지 않는다.
- **feature 코드에서 `_apis` 직접 import 금지** — `@/app/_global/_queries` 경유. `_queries`는 `queryKey`/`queryOptions`/`mutationOptions`만 정의하고 `useQuery`를 호출하지 않는다.
- 객체 타입은 `type` 별칭. 타입 전용 import는 `import type`.
- `console.log` 금지. 컴포넌트 폴더 안에 프라이빗 폴더 금지.
- 각 태스크 마지막에 `pnpm lint && pnpm typecheck && pnpm test` 통과.
- 커밋 메시지는 Conventional Commits.

**Figma 토큰 매핑** (확인 완료 — 새 토큰을 만들지 말고 그대로 쓴다)

| Figma                            | 프로젝트                     |
| -------------------------------- | ---------------------------- |
| Background/Surface `#F0F0F0`     | `bg-bg-surface`              |
| Text/Secondary `#222222`         | `text-text-secondary`        |
| Text/Placeholder 50% `#31313180` | `text-text-placeholder-a50`  |
| Interactive/Required `#EF5A06`   | `text-interactive-required`  |
| 저장 버튼 `#333333`              | `Button` `variant="default"` |
| Title/Body/M/medium 16px         | `text-body-16md`             |
| Title/Body/S/Medium 14px         | `text-body-14md`             |
| Title/S/Bold 18px                | `text-title-18bd`            |
| 입력 radius 16px                 | `rounded-2xl`                |

## File Structure

**신규**

| 파일                                                              | 책임                                     |
| ----------------------------------------------------------------- | ---------------------------------------- |
| `app/_global/_components/Textfield/Textfield.tsx`                 | 라벨 + 필수 표시 + 에러를 갖춘 공용 입력 |
| `app/trace/new/_services/bookForm.service.ts`                     | 등록 폼 값 검증과 요청 변환 (순수 함수)  |
| `app/trace/new/_components/BookSearchView/BookSearchView.tsx`     | 기존 검색 UI + 외부 폴백 섹션 배치       |
| `app/trace/new/_components/ExternalBookList/ExternalBookList.tsx` | 알라딘 결과 목록 + "직접 추가하기"       |
| `app/trace/new/_components/BookAddForm/BookAddForm.tsx`           | 등록 폼 (Figma `2260:9660`)              |
| `app/trace/new/_tests/bookForm.spec.ts`                           | 검증·변환 테스트                         |
| `app/trace/new/_tests/bookPicker.spec.tsx`                        | 폴백 렌더·등록 성공·실패 통합 테스트     |

**수정**

| 파일                                                           | 변경                                                      |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| `app/_global/_queries/book.queries.ts`                         | `searchExternal` queryOptions, `bookMutations.create`     |
| `app/_shared/book/_components/BookItem/BookItem.tsx`           | 대목·흔적 수 prop을 optional로, 없으면 배지 숨김          |
| `app/trace/new/_components/BookPicker/BookPicker.tsx`          | 뷰 상태(`search`/`form`)로 축소, 검색 UI는 새 파일로 이관 |
| `app/_shared/book/_components/BookSearchBar/BookSearchBar.tsx` | 주석 정리 (`onAddBook` 미지정 설명이 더는 맞지 않음)      |

---

### Task 1: 외부 검색 쿼리와 등록 mutation

**Files:**

- Modify: `app/_global/_queries/book.queries.ts`

**Interfaces:**

- Consumes: `searchExternalBooks`, `createBook` (`_apis/_generated/book/book`)
- Produces:
  - `bookQueries.searchExternal(params: SearchExternalBooksParams)` — `queryOptions`
  - `bookMutations.all()`, `bookMutations.create()` — `mutationOptions`, `mutationFn: (data: CreateBookRequest) => createBook(data)`

- [ ] **Step 1: 쿼리·뮤테이션 추가**

`app/_global/_queries/book.queries.ts`의 import에 다음을 더한다.

```ts
import { mutationOptions } from '@tanstack/react-query'

import {
  createBook,
  getHomeCarouselBooks,
  getPopularBooks,
  getRecentBooks,
  searchExternalBooks,
  searchInternalBooks,
} from '../_apis/_generated/book/book'
import type { CreateBookRequest } from '../_apis/_generated/models/createBookRequest'
import type { SearchExternalBooksParams } from '../_apis/_generated/models/searchExternalBooksParams'
```

`bookQueries` 객체의 `popular` 아래에 추가한다.

```ts
  // 내부 검색에 없는 책을 등록할 때 쓰는 알라딘 검색. bookId가 없어 그대로는 고를 수 없고,
  // POST /api/books로 등록해야 흔적을 남길 수 있다. 한 화면 분량이면 충분해 페이지네이션은 두지 않는다.
  searchExternal: (params: SearchExternalBooksParams) =>
    queryOptions({
      queryKey: [...bookQueries.all(), 'external-search', params],
      queryFn: () => searchExternalBooks(params),
    }),
```

파일 끝에 mutation을 추가한다.

```ts
export const bookMutations = {
  all: () => ['book'] as const,
  create: () =>
    mutationOptions({
      mutationKey: [...bookMutations.all(), 'create'],
      mutationFn: (data: CreateBookRequest) => createBook(data),
    }),
}
```

- [ ] **Step 2: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/_global/_queries/book.queries.ts
git commit -m "feat: 도서 외부 검색 쿼리와 등록 mutation을 추가한다"
```

---

### Task 2: 공용 Textfield

**Files:**

- Create: `app/_global/_components/Textfield/Textfield.tsx`
- Test: `app/_global/_tests/textfield.spec.tsx`

**Interfaces:**

- Consumes: `cn` (`@/app/_global/_services/cn.service`)
- Produces: `Textfield` — `Omit<ComponentPropsWithoutRef<'input'>, 'type'> & { errorMessage?: string; label: string; required?: boolean }`

- [ ] **Step 1: 실패하는 테스트 작성**

`app/_global/_tests/textfield.spec.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Textfield } from '../_components/Textfield/Textfield'

describe('Textfield', () => {
  it('라벨과 입력을 연결한다', () => {
    render(<Textfield label="제목" placeholder="책 제목을 입력해 주세요." />)
    expect(screen.getByLabelText('제목')).toBeTruthy()
  })

  it('필수 필드는 표시와 required 속성을 함께 준다', () => {
    render(<Textfield label="지은이" required />)
    const input = screen.getByLabelText(/지은이/)
    expect(input.hasAttribute('required')).toBe(true)
  })

  it('에러 메시지를 입력과 연결해 알린다', () => {
    render(<Textfield label="페이지 수" errorMessage="1 이상의 숫자를 입력해 주세요." />)
    const input = screen.getByLabelText('페이지 수')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByText('1 이상의 숫자를 입력해 주세요.')).toBeTruthy()
    expect(input.getAttribute('aria-describedby')).toBe(
      screen.getByText('1 이상의 숫자를 입력해 주세요.').id,
    )
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run app/_global/_tests/textfield.spec.tsx`
Expected: FAIL — `Failed to resolve import "../_components/Textfield/Textfield"`

- [ ] **Step 3: 컴포넌트 구현**

`app/_global/_components/Textfield/Textfield.tsx`

```tsx
'use client'

import { type ComponentPropsWithoutRef, useId } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

// Figma 2260:9675(TextFiled) — 라벨 14 Medium + 필수 * Interactive/Required,
// 입력 Background/Surface · radius 16 · padding 16 · 16 Medium.
type TextfieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'> & {
  errorMessage?: string
  label: string
  required?: boolean
}

export function Textfield({
  className,
  errorMessage,
  label,
  required = false,
  ...props
}: TextfieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`

  return (
    <div className={cn('flex w-full flex-col gap-1', className)}>
      <label
        htmlFor={inputId}
        className="flex items-start gap-0.5 text-body-14md text-text-secondary"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="font-bold text-interactive-required">
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        required={required}
        aria-invalid={errorMessage ? true : undefined}
        aria-describedby={errorMessage ? errorId : undefined}
        className="w-full rounded-2xl bg-bg-surface p-4 text-body-16md text-text-secondary outline-none placeholder:text-text-placeholder-a50"
        {...props}
      />
      {errorMessage && (
        <p id={errorId} className="text-body-14md text-text-accent">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run app/_global/_tests/textfield.spec.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add app/_global/_components/Textfield app/_global/_tests/textfield.spec.tsx
git commit -m "feat: 라벨과 필수 표시를 갖춘 공용 Textfield를 추가한다"
```

---

### Task 3: 등록 폼 검증 서비스

**Files:**

- Create: `app/trace/new/_services/bookForm.service.ts`
- Test: `app/trace/new/_tests/bookForm.spec.ts`

**Interfaces:**

- Consumes: 없음
- Produces:
  - `type BookFormField = 'author' | 'isbn' | 'pageCount' | 'publisher' | 'title'`
  - `type BookFormValues = Record<BookFormField, string>`
  - `type BookFormErrors = Partial<Record<BookFormField, string>>`
  - `emptyBookForm: BookFormValues`
  - `validateBookForm(values: BookFormValues): BookFormErrors`
  - `isValidBookForm(values: BookFormValues): boolean`
  - `toCreateBookInput(values: BookFormValues, coverImageUrl: null | string): { author: string; coverImageUrl?: string; isbn?: string; pageCount: number; publisher: string; title: string }`

- [ ] **Step 1: 실패하는 테스트 작성**

`app/trace/new/_tests/bookForm.spec.ts`

```ts
import { describe, expect, it } from 'vitest'

import {
  emptyBookForm,
  isValidBookForm,
  toCreateBookInput,
  validateBookForm,
} from '../_services/bookForm.service'

const filled = {
  author: '한강',
  isbn: '9788936434120',
  pageCount: '268',
  publisher: '창비',
  title: '채식주의자',
}

describe('validateBookForm', () => {
  it('빈 폼은 필수 네 항목을 모두 지적한다', () => {
    expect(Object.keys(validateBookForm(emptyBookForm)).sort()).toEqual([
      'author',
      'pageCount',
      'publisher',
      'title',
    ])
  })

  it('공백만 넣은 값은 비어 있는 것으로 본다', () => {
    const errors = validateBookForm({ ...filled, title: '   ' })
    expect(errors.title).toBeTruthy()
  })

  it('ISBN은 비어 있어도 문제 삼지 않는다', () => {
    expect(validateBookForm({ ...filled, isbn: '' })).toEqual({})
  })

  it('페이지 수는 1 이상의 정수만 받는다', () => {
    expect(validateBookForm({ ...filled, pageCount: '0' }).pageCount).toBeTruthy()
    expect(validateBookForm({ ...filled, pageCount: '-3' }).pageCount).toBeTruthy()
    expect(validateBookForm({ ...filled, pageCount: '12.5' }).pageCount).toBeTruthy()
    expect(validateBookForm({ ...filled, pageCount: '쪽수' }).pageCount).toBeTruthy()
    expect(validateBookForm({ ...filled, pageCount: '1' })).toEqual({})
  })
})

describe('isValidBookForm', () => {
  it('필수 항목이 모두 채워지면 통과한다', () => {
    expect(isValidBookForm(filled)).toBe(true)
    expect(isValidBookForm(emptyBookForm)).toBe(false)
  })
})

describe('toCreateBookInput', () => {
  it('페이지 수를 숫자로 바꾸고 앞뒤 공백을 턴다', () => {
    expect(toCreateBookInput({ ...filled, title: '  채식주의자 ' }, null)).toEqual({
      author: '한강',
      isbn: '9788936434120',
      pageCount: 268,
      publisher: '창비',
      title: '채식주의자',
    })
  })

  it('빈 ISBN과 커버는 아예 넣지 않는다', () => {
    // 빈 문자열을 그대로 보내면 서버가 형식 검증에서 400을 낸다.
    const input = toCreateBookInput({ ...filled, isbn: '' }, null)
    expect('isbn' in input).toBe(false)
    expect('coverImageUrl' in input).toBe(false)
  })

  it('커버 URL이 있으면 함께 보낸다', () => {
    expect(toCreateBookInput(filled, 'https://image.aladin.co.kr/cover.jpg').coverImageUrl).toBe(
      'https://image.aladin.co.kr/cover.jpg',
    )
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run app/trace/new/_tests/bookForm.spec.ts`
Expected: FAIL — `Failed to resolve import "../_services/bookForm.service"`

- [ ] **Step 3: 서비스 구현**

`app/trace/new/_services/bookForm.service.ts`

```ts
export type BookFormField = 'author' | 'isbn' | 'pageCount' | 'publisher' | 'title'

export type BookFormValues = Record<BookFormField, string>

export type BookFormErrors = Partial<Record<BookFormField, string>>

type CreateBookInput = {
  author: string
  coverImageUrl?: string
  isbn?: string
  pageCount: number
  publisher: string
  title: string
}

export const emptyBookForm: BookFormValues = {
  author: '',
  isbn: '',
  pageCount: '',
  publisher: '',
  title: '',
}

const REQUIRED_TEXT_MESSAGE: Record<'author' | 'publisher' | 'title', string> = {
  author: '지은이를 입력해 주세요.',
  publisher: '출판사를 입력해 주세요.',
  title: '책 제목을 입력해 주세요.',
}

export function validateBookForm(values: BookFormValues): BookFormErrors {
  const errors: BookFormErrors = {}

  for (const field of ['author', 'publisher', 'title'] as const) {
    if (values[field].trim().length === 0) errors[field] = REQUIRED_TEXT_MESSAGE[field]
  }

  // 알라딘도 pageNumber 상한 검사도 쪽수를 요구한다. 서버에서는 optional이지만 여기서 필수로 받는다.
  const pageCount = Number(values.pageCount.trim())
  if (values.pageCount.trim().length === 0 || !Number.isInteger(pageCount) || pageCount < 1) {
    errors.pageCount = '페이지 수를 1 이상의 숫자로 입력해 주세요.'
  }

  return errors
}

export function isValidBookForm(values: BookFormValues): boolean {
  return Object.keys(validateBookForm(values)).length === 0
}

export function toCreateBookInput(
  values: BookFormValues,
  coverImageUrl: null | string,
): CreateBookInput {
  const isbn = values.isbn.trim()

  return {
    author: values.author.trim(),
    // 빈 문자열을 보내면 서버 형식 검증에 걸린다. 없는 값은 키 자체를 넣지 않는다.
    ...(isbn.length > 0 ? { isbn } : {}),
    ...(coverImageUrl ? { coverImageUrl } : {}),
    pageCount: Number(values.pageCount.trim()),
    publisher: values.publisher.trim(),
    title: values.title.trim(),
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm vitest run app/trace/new/_tests/bookForm.spec.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add app/trace/new/_services/bookForm.service.ts app/trace/new/_tests/bookForm.spec.ts
git commit -m "feat: 도서 등록 폼 검증 서비스를 추가한다"
```

---

### Task 4: 등록 폼 컴포넌트

**Files:**

- Create: `app/trace/new/_components/BookAddForm/BookAddForm.tsx`

**Interfaces:**

- Consumes: `Textfield` (Task 2), `bookForm.service` (Task 3), `bookMutations.create()` (Task 1), `SelectedBook` (`_types/traceDraft.type`)
- Produces: `BookAddForm` — props `{ coverImageUrl: null | string; initialValues: BookFormValues; onClose: () => void; onCreated: (book: SelectedBook) => void }`

- [ ] **Step 1: 컴포넌트 작성**

`app/trace/new/_components/BookAddForm/BookAddForm.tsx`

```tsx
'use client'

import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import { Button } from '@/app/_global/_components/Button/Button'
import CloseIcon from '@/app/_global/_components/Icon/assets/close.svg'
import { Snackbar } from '@/app/_global/_components/Snackbar/Snackbar'
import { Textfield } from '@/app/_global/_components/Textfield/Textfield'
import { TopBar } from '@/app/_global/_components/TopBar/TopBar'
import { ApiError } from '@/app/_global/_apis/customFetch.api'
import { bookMutations } from '@/app/_global/_queries/book.queries'

import {
  type BookFormField,
  type BookFormValues,
  isValidBookForm,
  toCreateBookInput,
  validateBookForm,
} from '../../_services/bookForm.service'
import type { SelectedBook } from '../../_types/traceDraft.type'

type BookAddFormProps = {
  /** 알라딘에서 고른 책의 표지. 업로드 API가 없어 표시 전용이다. */
  coverImageUrl: null | string
  initialValues: BookFormValues
  onClose: () => void
  onCreated: (book: SelectedBook) => void
}

const FIELDS: {
  field: BookFormField
  label: string
  numeric?: boolean
  placeholder: string
  required: boolean
}[] = [
  { field: 'title', label: '제목', placeholder: '책 제목을 입력해 주세요.', required: true },
  { field: 'author', label: '지은이', placeholder: '책 지은이를 입력해 주세요.', required: true },
  {
    field: 'publisher',
    label: '출판사',
    placeholder: '책 출판사를 입력해 주세요.',
    required: true,
  },
  {
    field: 'pageCount',
    label: '페이지 수',
    numeric: true,
    placeholder: '책 페이지를 입력해 주세요.',
    required: true,
  },
  { field: 'isbn', label: 'ISBN', placeholder: 'ISBN을 입력해 주세요.', required: false },
]

const MAX_PAGE_DIGITS = 5

export function BookAddForm({
  coverImageUrl,
  initialValues,
  onClose,
  onCreated,
}: BookAddFormProps) {
  const [values, setValues] = useState<BookFormValues>(initialValues)
  // 처음부터 빨간 글씨를 띄우지 않는다. 저장을 눌러 막힌 뒤부터 보여준다.
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [message, setMessage] = useState('')
  const createBook = useMutation(bookMutations.create())

  const errors = isSubmitted ? validateBookForm(values) : {}

  const handleSubmit = () => {
    setIsSubmitted(true)
    if (!isValidBookForm(values)) return

    createBook.mutate(toCreateBookInput(values, coverImageUrl), {
      onSuccess: (response) => {
        const created = response.data
        if (!created) {
          setMessage('책을 등록하지 못했어요. 잠시 후 다시 시도해주세요.')
          return
        }
        onCreated({
          bookId: created.bookId,
          title: created.title,
          author: created.author,
          coverImageUrl: created.coverImageUrl ?? null,
          pageCount: created.pageCount,
        })
      },
      onError: (error) => {
        // 같은 책이 이미 있으면 400이 온다. 여기서 다시 눌러도 결과가 같으니 검색으로 유도한다.
        if (error instanceof ApiError && error.status === 400) {
          setMessage('이미 등록된 책일 수 있어요. 검색으로 찾아보세요.')
          return
        }
        setMessage('책을 등록하지 못했어요. 잠시 후 다시 시도해주세요.')
      },
    })
  }

  return (
    <main className="flex h-full min-h-0 flex-col bg-bg-default">
      {/* 노치 인셋은 레이아웃 셸이 이미 소비했다 — 여기서 다시 더하면 두 번 내려간다 */}
      <TopBar.Root>
        <TopBar.Title as="h1">책 추가하기</TopBar.Title>
        <TopBar.Spacer />
        <TopBar.Action aria-label="닫기" onClick={onClose}>
          <CloseIcon />
        </TopBar.Action>
      </TopBar.Root>

      <div className="scrollbar-none flex min-h-0 flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden">
        {/* Figma 2260:9671 — 표지 자리. 업로드 API가 없어 알라딘 표지가 있을 때만 채워진다. */}
        <div className="flex shrink-0 items-center justify-center px-4 py-3.5">
          <div className="h-[120px] w-20 shrink-0 overflow-hidden rounded-[2px] border border-border-book bg-bg-surface shadow-[4px_10px_17.5px_rgba(0,0,0,0.2)]">
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
              <img src={coverImageUrl} alt="" className="size-full object-cover" />
            ) : (
              <p className="flex size-full items-center justify-center px-1 text-center text-body-14md text-text-secondary">
                책 이미지를
                <br />
                등록해주세요
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 py-6">
          {FIELDS.map(({ field, label, numeric, placeholder, required }) => (
            <Textfield
              key={field}
              label={label}
              required={required}
              placeholder={placeholder}
              inputMode={numeric ? 'numeric' : undefined}
              maxLength={numeric ? MAX_PAGE_DIGITS : undefined}
              value={values[field]}
              errorMessage={errors[field]}
              onChange={(event) => {
                const next = numeric
                  ? event.target.value.replace(/[^0-9]/g, '').slice(0, MAX_PAGE_DIGITS)
                  : event.target.value
                setValues((prev) => ({ ...prev, [field]: next }))
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="mt-auto flex shrink-0 p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <Button className="h-[54px] flex-1" disabled={createBook.isPending} onClick={handleSubmit}>
          저장하기
        </Button>
      </div>

      <Snackbar
        message={message}
        onClose={() => {
          setMessage('')
        }}
      />
    </main>
  )
}
```

- [ ] **Step 2: 참조가 실제로 존재하는지 확인**

Run:

```bash
rg -n "export class ApiError|border-border-book|scrollbar-none" app/_global/_apis/customFetch.api.ts app/globals.css app/trace/new/_components/BookPicker/BookPicker.tsx
```

Expected: `ApiError`가 `customFetch.api.ts`에 있고, `border-book` 토큰과 `scrollbar-none` 유틸이 존재한다. 없으면 `BookItem.tsx:44`(`border-border-book/10`)과 `BookPicker.tsx:124`에서 실제 클래스명을 확인해 맞춘다.

- [ ] **Step 3: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS (아직 아무도 이 컴포넌트를 쓰지 않아 동작 변화는 없다)

```bash
git add app/trace/new/_components/BookAddForm
git commit -m "feat: 도서 직접 등록 폼을 추가한다"
```

---

### Task 5: 외부 결과 목록과 BookItem 배지 분기

**Files:**

- Modify: `app/_shared/book/_components/BookItem/BookItem.tsx:7-14,61-64`
- Create: `app/trace/new/_components/ExternalBookList/ExternalBookList.tsx`

**Interfaces:**

- Consumes: `BookItem`
- Produces:
  - `BookItem`의 `opinionCount`/`passageCount`가 optional — 둘 다 없으면 배지 영역을 렌더하지 않는다
  - `type ExternalBook = { author: string; coverImageUrl: null | string; isbn: string; publisher: string; title: string }`
  - `ExternalBookList` — props `{ books: ExternalBook[]; isPending: boolean; onAddManually: () => void; onSelect: (book: ExternalBook) => void }`

- [ ] **Step 1: `BookItem` prop을 optional로**

`app/_shared/book/_components/BookItem/BookItem.tsx`

```tsx
type BookItemProps = ComponentPropsWithoutRef<'article'> & {
  author: string
  coverImageUrl?: null | string
  /** 외부 검색 결과에는 없는 값이다. 없으면 배지를 그리지 않는다. */
  opinionCount?: number
  passageCount?: number
  publisher?: string
  title: string
}
```

배지 영역:

```tsx
{
  passageCount !== undefined && opinionCount !== undefined && (
    <div className="flex items-center gap-1">
      <BookStat icon="content" value={passageCount} />
      <BookStat icon="pencil" value={opinionCount} />
    </div>
  )
}
```

- [ ] **Step 2: `ExternalBookList` 작성**

`app/trace/new/_components/ExternalBookList/ExternalBookList.tsx`

```tsx
'use client'

import { Button } from '@/app/_global/_components/Button/Button'
import { BookItem } from '@/app/_shared/book/_components/BookItem/BookItem'

export type ExternalBook = {
  author: string
  coverImageUrl: null | string
  isbn: string
  publisher: string
  title: string
}

type ExternalBookListProps = {
  books: ExternalBook[]
  isPending: boolean
  onAddManually: () => void
  onSelect: (book: ExternalBook) => void
}

const SKELETON_KEYS = ['a', 'b', 'c']

export function ExternalBookList({
  books,
  isPending,
  onAddManually,
  onSelect,
}: ExternalBookListProps) {
  return (
    <section aria-label="팔랑에 아직 없는 책" className="flex flex-col gap-3 px-4 py-6">
      <p className="text-body-14md text-text-tertiary">
        팔랑에 아직 없는 책이에요.
        <br />
        아래에서 고르면 바로 등록할 수 있어요.
      </p>

      {isPending ? (
        <div role="status" aria-label="책을 불러오는 중" className="flex flex-col gap-3">
          {SKELETON_KEYS.map((key) => (
            <div key={key} className="flex animate-pulse gap-4">
              <div className="h-[120px] w-20 shrink-0 rounded-[2px] bg-bg-surface" />
              <div className="flex flex-1 flex-col gap-2 pt-1">
                <div className="h-5 w-2/3 rounded bg-bg-surface" />
                <div className="h-4 w-1/2 rounded bg-bg-surface" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {books.map((book) => (
            // 알라딘 결과에는 bookId가 없다. 같은 책의 다른 판본이 섞이므로 isbn+제목으로 구분한다.
            <li key={`${book.isbn}-${book.title}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(book)
                }}
                className="w-full cursor-pointer text-left"
              >
                <BookItem
                  author={book.author}
                  coverImageUrl={book.coverImageUrl}
                  publisher={book.publisher}
                  title={book.title}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="back" className="h-[54px] w-full" onClick={onAddManually}>
        직접 추가하기
      </Button>
    </section>
  )
}
```

- [ ] **Step 3: 검증 후 커밋**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: PASS

```bash
git add app/_shared/book/_components/BookItem/BookItem.tsx app/trace/new/_components/ExternalBookList
git commit -m "feat: 알라딘 검색 결과 목록을 추가한다"
```

---

### Task 6: 검색 화면 분리와 폼 전환 배선

**Files:**

- Create: `app/trace/new/_components/BookSearchView/BookSearchView.tsx`
- Modify: `app/trace/new/_components/BookPicker/BookPicker.tsx`
- Modify: `app/_shared/book/_components/BookSearchBar/BookSearchBar.tsx:9-10`
- Test: `app/trace/new/_tests/bookPicker.spec.tsx`

**Interfaces:**

- Consumes: `ExternalBookList`·`ExternalBook` (Task 5), `BookAddForm` (Task 4), `emptyBookForm`·`BookFormValues` (Task 3), `bookQueries.searchExternal` (Task 1), `useOverlayBackGuard` (#94 Task 4), `useTraceNav` (#94 Task 5)
- Produces:
  - `BookSearchView` — props `{ onAddManually: () => void; onBack: () => void; onSelect: (book: SelectedBook) => void; onSelectExternal: (book: ExternalBook) => void }`
  - `BookPicker`는 뷰 전환과 시트만 담당

- [ ] **Step 1: 실패하는 통합 테스트 작성**

`app/trace/new/_tests/bookPicker.spec.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BookPicker } from '../_components/BookPicker/BookPicker'
import { TraceDraftProvider } from '../_components/TraceDraftProvider/TraceDraftProvider'
import { TraceNavProvider } from '../_components/TraceNavProvider/TraceNavProvider'
import { TraceOverlayProvider } from '../_components/TraceOverlayProvider/TraceOverlayProvider'

const { apiState } = vi.hoisted(() => ({
  apiState: {
    createResult: null as unknown,
    externalBooks: [] as unknown[],
    internalBooks: [] as unknown[],
  },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/trace/new',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('@/app/_global/_apis/_generated/book/book', () => ({
  createBook: () => Promise.resolve(apiState.createResult),
  getPopularBooks: () => Promise.resolve({ data: { books: [] } }),
  getRecentBooks: () => Promise.resolve({ data: { books: [] } }),
  searchExternalBooks: () => Promise.resolve({ data: { books: apiState.externalBooks } }),
  searchInternalBooks: () =>
    Promise.resolve({
      data: { books: apiState.internalBooks, pageInfo: { page: 0, hasNext: false } },
    }),
}))

vi.mock('@/app/_global/_apis/_generated/user/user', () => ({
  getMyProfile: () => Promise.resolve({ data: { nickname: '나' } }),
}))

function renderPicker() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <TraceDraftProvider>
        <TraceOverlayProvider>
          <TraceNavProvider>
            <BookPicker />
          </TraceNavProvider>
        </TraceOverlayProvider>
      </TraceDraftProvider>
    </QueryClientProvider>,
  )
}

describe('BookPicker 도서 추가', () => {
  beforeEach(() => {
    apiState.createResult = null
    apiState.externalBooks = []
    apiState.internalBooks = []
  })

  it('내부 결과가 없으면 알라딘 결과를 폴백으로 보여준다', async () => {
    apiState.externalBooks = [
      {
        title: '채식주의자',
        author: '한강',
        publisher: '창비',
        isbn: '9788936434120',
        coverImageUrl: 'https://image.aladin.co.kr/cover.jpg',
      },
    ]

    renderPicker()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '채식주의자' } })

    await waitFor(() => {
      expect(screen.getByLabelText('팔랑에 아직 없는 책')).toBeTruthy()
    })
    expect(screen.getByText('채식주의자')).toBeTruthy()
  })

  it('알라딘 결과를 고르면 폼이 채워진 채로 열린다', async () => {
    apiState.externalBooks = [
      {
        title: '채식주의자',
        author: '한강',
        publisher: '창비',
        isbn: '9788936434120',
        coverImageUrl: null,
      },
    ]

    renderPicker()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '채식주의자' } })
    await waitFor(() => {
      expect(screen.getByLabelText('팔랑에 아직 없는 책')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('채식주의자'))

    expect(screen.getByRole('heading', { name: '책 추가하기' })).toBeTruthy()
    expect(screen.getByLabelText(/제목/).getAttribute('value')).toBe('채식주의자')
    // 알라딘은 쪽수를 주지 않는다. 사용자가 직접 채워야 한다.
    expect(screen.getByLabelText(/페이지 수/).getAttribute('value')).toBe('')
  })

  it('필수 항목이 비면 저장이 막히고 안내가 뜬다', async () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button', { name: '도서 추가' }))
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(screen.getByText('책 제목을 입력해 주세요.')).toBeTruthy()
    })
  })

  it('등록에 성공하면 대목 입력 방식을 묻는다', async () => {
    apiState.createResult = {
      data: {
        bookId: 7,
        title: '채식주의자',
        author: '한강',
        publisher: '창비',
        pageCount: 268,
        coverImageUrl: null,
        source: 'MANUAL',
      },
    }

    renderPicker()
    fireEvent.click(screen.getByRole('button', { name: '도서 추가' }))
    fireEvent.change(screen.getByLabelText(/제목/), { target: { value: '채식주의자' } })
    fireEvent.change(screen.getByLabelText(/지은이/), { target: { value: '한강' } })
    fireEvent.change(screen.getByLabelText(/출판사/), { target: { value: '창비' } })
    fireEvent.change(screen.getByLabelText(/페이지 수/), { target: { value: '268' } })
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => {
      expect(screen.getByText('새로운 흔적을 어떻게 남길까요?')).toBeTruthy()
    })
  })
})
```

> 모킹 대상 경로(`_generated/user/user`의 함수명 등)는 실제 파일을 열어 확인하고 맞춘다. `rg -n "export const get" app/_global/_apis/_generated/user/user.ts`

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm vitest run app/trace/new/_tests/bookPicker.spec.tsx`
Expected: FAIL — 폴백 섹션과 폼이 없다

- [ ] **Step 3: `BookSearchView` 작성**

`BookPicker.tsx`의 다음 부분을 **그대로** 새 파일로 옮긴다 (원본 줄 번호는 이 계획을 쓸 때 기준이다).

- import: `keepPreviousData` / `useInfiniteQuery` / `useQuery`, `FeedbackState`, `BackIcon`, `TopBar`, `useDebouncedValue`, `useLoadMoreOnVisible`, `bookQueries`, `userQueries`, `BookSearchBar`, `BookCoverCarousel`, `BookPickList`
- state와 쿼리: `keyword` / `scrollRef` / `loadMoreRef` / `debouncedKeyword` / `isSearching` / `isTypingAhead` / `me` / `recent` / `popular` / `searched` / `useLoadMoreOnVisible` 블록 (`BookPicker.tsx:28-64`)
- 파생값: `searchResults` / `recentBooks` / `popularBooks` / `showRecent` / `showPopular` (`BookPicker.tsx:71-104`)
- JSX: `<main>` ~ 스크롤 컨테이너와 캐러셀·빈 상태 (`BookPicker.tsx:107-172`). `TraceSourceSheet`·`ManualQuoteSheet`는 옮기지 않는다 — 시트는 `BookPicker`에 남는다.

`handleSelect`는 props의 `onSelect`로 대체한다. 컴포넌트 시그니처는 이렇다.

```tsx
type BookSearchViewProps = {
  onAddManually: () => void
  onBack: () => void
  onSelect: (book: SelectedBook) => void
  onSelectExternal: (book: ExternalBook) => void
}

export function BookSearchView({
  onAddManually,
  onBack,
  onSelect,
  onSelectExternal,
}: BookSearchViewProps) {
```

옮긴 뒤 다음 세 가지를 더한다.

1. 외부 검색 쿼리

```tsx
const internalBooks = searchResults
// 내부에 있으면 그 책을 고르는 게 맞다. 없을 때만 알라딘을 부른다.
const shouldSearchExternal =
  isSearching && !isTypingAhead && !searched.isPending && internalBooks.length === 0

const external = useQuery({
  ...bookQueries.searchExternal({ keyword: debouncedKeyword, size: PAGE_SIZE }),
  enabled: shouldSearchExternal,
})

const externalBooks: ExternalBook[] = (external.data?.data?.books ?? []).map((book) => ({
  author: book.author ?? '',
  coverImageUrl: book.coverImageUrl ?? null,
  isbn: book.isbn ?? '',
  publisher: book.publisher ?? '',
  title: book.title ?? '',
}))
```

2. 검색바에 추가 버튼 연결

```tsx
<BookSearchBar
  placeholder="책 제목을 입력해 주세요."
  onAddBook={onAddManually}
  onKeywordChange={setKeyword}
/>
```

3. 내부 결과가 0건인 자리에 폴백 섹션

```tsx
{
  isSearching ? (
    <>
      {internalBooks.length > 0 || searched.isPending ? (
        <BookPickList
          books={internalBooks}
          status={(() => {
            if (searched.isPending) return 'pending'
            if (isError && internalBooks.length === 0) return 'error'
            return 'ready'
          })()}
          onRetry={() => {
            void searched.refetch()
          }}
          onSelect={onSelect}
        />
      ) : (
        <ExternalBookList
          books={externalBooks}
          isPending={external.isPending && shouldSearchExternal}
          onAddManually={onAddManually}
          onSelect={onSelectExternal}
        />
      )}
      <div ref={loadMoreRef} className="h-6 w-full shrink-0" aria-hidden="true" />
    </>
  ) : showRecent || showPopular ? (
    /* 옮겨온 캐러셀 블록 그대로 — onSelect만 props의 onSelect로 바뀐다 */
    <div className="flex flex-col gap-10 px-4 pt-6 pb-10">{/* ... */}</div>
  ) : (
    /* 옮겨온 FeedbackState 빈 상태 그대로 */
    <FeedbackState aria-label="빈 도서 목록" message={/* ... */ null} />
  )
}
```

> 위 두 분기(`showRecent || showPopular`, 빈 상태)는 `BookPicker.tsx:142-171`에서 옮겨온 코드를 **수정 없이** 쓴다. 이 계획에서는 자리만 표시했다.

TopBar 뒤로 버튼은 `onBack`을 호출한다.

```tsx
<TopBar.Action
  aria-label="뒤로"
  onClick={() => {
    onBack()
  }}
>
  <BackIcon />
</TopBar.Action>
```

- [ ] **Step 4: `BookPicker`를 뷰 전환으로 축소**

```tsx
'use client'

import { useState } from 'react'

import { useOverlayBackGuard } from '../../_hooks/useOverlayBackGuard'
import { useTraceDraft } from '../../_hooks/useTraceDraft'
import { useTraceNav } from '../../_hooks/useTraceNav'
import { emptyBookForm, type BookFormValues } from '../../_services/bookForm.service'
import type { SelectedBook } from '../../_types/traceDraft.type'
import { BookAddForm } from '../BookAddForm/BookAddForm'
import { BookSearchView } from '../BookSearchView/BookSearchView'
import type { ExternalBook } from '../ExternalBookList/ExternalBookList'
import { ManualQuoteSheet } from '../ManualQuoteSheet/ManualQuoteSheet'
import { TraceSourceSheet } from '../TraceSourceSheet/TraceSourceSheet'

type PickerView =
  { coverImageUrl: null | string; type: 'form'; values: BookFormValues } | { type: 'search' }

export function BookPicker() {
  const { draft, dispatch } = useTraceDraft()
  const { goTo, requestExit } = useTraceNav()
  const [view, setView] = useState<PickerView>({ type: 'search' })
  // 완료 화면에서 '흔적 남기기'로 돌아오면 책이 유지된 채 이 화면으로 다시 진입한다(리마운트).
  // 마운트 시점에 draft.book은 있고 quotedText가 비어 있으면 방식 선택 시트를 바로 연다.
  const [sheet, setSheet] = useState<'manual' | 'none' | 'source'>(() =>
    draft.book && !draft.quotedText ? 'source' : 'none',
  )

  const closeForm = () => {
    setView({ type: 'search' })
  }

  // 폼과 시트는 뒤로가기가 화면을 떠나는 대신 한 층씩 걷어내야 하는 대상이다
  useOverlayBackGuard(view.type === 'form', closeForm)
  useOverlayBackGuard(sheet !== 'none', () => {
    setSheet('none')
  })

  const handleSelect = (book: SelectedBook) => {
    dispatch({ type: 'selectBook', book })
    setView({ type: 'search' })
    setSheet('source')
  }

  return (
    <>
      {view.type === 'form' ? (
        <BookAddForm
          coverImageUrl={view.coverImageUrl}
          initialValues={view.values}
          onClose={closeForm}
          onCreated={handleSelect}
        />
      ) : (
        <BookSearchView
          onAddManually={() => {
            setView({ coverImageUrl: null, type: 'form', values: emptyBookForm })
          }}
          onBack={requestExit}
          onSelect={handleSelect}
          onSelectExternal={(book: ExternalBook) => {
            // 알라딘은 쪽수를 주지 않는다. 나머지만 채우고 페이지 수는 사용자가 입력한다.
            setView({
              coverImageUrl: book.coverImageUrl,
              type: 'form',
              values: {
                author: book.author,
                isbn: book.isbn,
                pageCount: '',
                publisher: book.publisher,
                title: book.title,
              },
            })
          }}
        />
      )}

      <TraceSourceSheet
        open={sheet === 'source'}
        onClose={() => {
          setSheet('none')
        }}
        onSelectPhoto={() => {
          dispatch({ type: 'setSource', source: 'photo' })
          setSheet('none')
          goTo('photo')
        }}
        onSelectManual={() => {
          dispatch({ type: 'setSource', source: 'manual' })
          setSheet('manual')
        }}
      />
      <ManualQuoteSheet
        open={sheet === 'manual'}
        onClose={() => {
          setSheet('none')
        }}
        onSubmit={(quotedText) => {
          dispatch({ type: 'setQuotedText', quotedText })
          setSheet('none')
          goTo('detail')
        }}
      />
    </>
  )
}
```

- [ ] **Step 5: `BookSearchBar` 주석 정리**

```tsx
  /** 도서 직접 등록 화면을 연다. 넘기지 않으면 버튼이 비활성으로 남는다(도서 목록 화면). */
  onAddBook?: () => void
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `pnpm vitest run app/trace/new/_tests/bookPicker.spec.tsx`
Expected: PASS (4 tests)

- [ ] **Step 7: 검증 후 커밋**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add app/trace/new app/_shared/book
git commit -m "feat: 검색에 없는 책을 직접 추가할 수 있게 한다"
```

---

### Task 7: 실기기 검증과 마무리

**Files:**

- 없음 (검증 전용)

**Interfaces:**

- Consumes: Task 1~6 전부
- Produces: 없음

- [ ] **Step 1: 전체 검증**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: 전부 PASS

- [ ] **Step 2: 프로덕션 빌드로 확인**

```bash
pnpm build && pnpm start
```

확인할 것:

1. 없는 책 제목을 검색 → 알라딘 결과가 뜬다
2. 결과를 고르면 제목·지은이·출판사·ISBN이 채워지고 페이지 수만 비어 있다
3. 페이지 수를 채워 저장 → 방식 선택 시트가 뜨고 그대로 흔적 작성이 이어진다
4. 검색바 옆 추가 버튼 → 빈 폼 → 전부 수동 입력해도 같은 흐름으로 이어진다
5. 필수 항목을 비우고 저장하면 필드 아래에 안내가 뜨고 요청이 나가지 않는다
6. 폼에서 X를 누르면 검색 화면으로 돌아온다 (플로우를 벗어나지 않는다)

- [ ] **Step 3: Android에서 하드웨어 back 확인**

```bash
pnpm cap:dev:android
```

폼이 열린 상태의 하드웨어 back이 폼만 닫고 검색 화면으로 돌아오는지 확인한다(#94의 오버레이 스택과 연결된 동작).

- [ ] **Step 4: 백엔드 확인 사항 공유**

`POST /api/books`에 같은 ISBN을 두 번 보냈을 때의 응답을 백엔드에 확인한다.

- 기존 도서를 반환한다면 → `BookAddForm`의 400 분기를 지우고 성공 응답의 `bookId`로 그대로 진행하도록 정리한다.
- 400이라면 → 현재 구현(안내 후 폼 유지)이 맞다. 에러 코드가 별도로 있으면 `error.code`로 좁힌다.

- [ ] **Step 5: PR 생성**

`.agents/pr-workflow.md`를 읽고 절차를 따른다. base는 `develop`, 제목은 `검색에 없는 책 직접 추가 (#95)`, 본문에 `Closes #95`.

export type BookFormField = 'author' | 'isbn' | 'pageCount' | 'publisher' | 'title'

export type BookFormValues = Record<BookFormField, string>

export type BookFormErrors = Partial<Record<BookFormField, string>>

type CreateBookInput = {
  author: string
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

/** 글을 쓴 사람으로 볼 역할. 앞에 있는 것부터 우선한다. */
const WRITER_ROLES = ['지은이', '글']

/**
 * 알라딘 author는 '사이토 로쿠로 (지은이), ATLUS (원작), 김완희 (옮긴이)'처럼
 * 역할 표기가 붙어서 온다. 그대로 등록하면 지은이 칸에 원작·옮긴이까지 들어간다.
 */
export function normalizeExternalAuthor(raw: string): string {
  const parsed = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      // 이름 안에도 괄호가 올 수 있다(아세움(박교은) (그림)). 마지막 괄호쌍만 역할로 본다.
      const matched = /^(.*)\s*\(([^()]*)\)$/.exec(entry)
      return matched
        ? { name: (matched[1] ?? '').trim(), role: (matched[2] ?? '').trim() }
        : { name: entry, role: '' }
    })

  const writers = WRITER_ROLES.map((role) => parsed.filter((item) => item.role === role)).find(
    (matches) => matches.length > 0,
  )

  return (writers ?? parsed).map((item) => item.name).join(', ')
}

export function validateBookForm(values: BookFormValues): BookFormErrors {
  const errors: BookFormErrors = {}

  for (const field of ['author', 'publisher', 'title'] as const) {
    if (values[field].trim().length === 0) errors[field] = REQUIRED_TEXT_MESSAGE[field]
  }

  // 알라딘도 쪽수를 주지 않고, 상세 단계의 페이지 상한 검사도 이 값에 기댄다. 서버에서는
  // optional이지만 여기서는 필수로 받는다.
  const pageCount = Number(values.pageCount.trim())
  if (values.pageCount.trim().length === 0 || !Number.isInteger(pageCount) || pageCount < 1) {
    errors.pageCount = '페이지 수를 1 이상의 숫자로 입력해 주세요.'
  }

  return errors
}

export function isValidBookForm(values: BookFormValues): boolean {
  return Object.keys(validateBookForm(values)).length === 0
}

// 표지는 서버가 multipart 파일(coverImage)로만 받게 바뀌어 URL은 더 이상 보내지 않는다.
export function toCreateBookInput(values: BookFormValues): CreateBookInput {
  const isbn = values.isbn.trim()

  return {
    author: values.author.trim(),
    // 빈 문자열을 보내면 서버 형식 검증에 걸린다. 없는 값은 키 자체를 넣지 않는다.
    ...(isbn.length > 0 ? { isbn } : {}),
    pageCount: Number(values.pageCount.trim()),
    publisher: values.publisher.trim(),
    title: values.title.trim(),
  }
}

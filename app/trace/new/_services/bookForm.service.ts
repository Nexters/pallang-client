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

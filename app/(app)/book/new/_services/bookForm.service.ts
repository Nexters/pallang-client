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

export function validateBookForm(values: BookFormValues): BookFormErrors {
  const errors: BookFormErrors = {}

  for (const field of ['author', 'publisher', 'title'] as const) {
    if (values[field].trim().length === 0) errors[field] = REQUIRED_TEXT_MESSAGE[field]
  }

  const pageCount = Number(values.pageCount.trim())
  if (values.pageCount.trim().length === 0 || !Number.isInteger(pageCount) || pageCount < 1) {
    errors.pageCount = '페이지 수를 1 이상의 숫자로 입력해 주세요.'
  }

  return errors
}

export function isValidBookForm(values: BookFormValues): boolean {
  return Object.keys(validateBookForm(values)).length === 0
}

export function toCreateBookInput(values: BookFormValues): CreateBookInput {
  const isbn = values.isbn.trim()

  return {
    author: values.author.trim(),
    ...(isbn.length > 0 ? { isbn } : {}),
    pageCount: Number(values.pageCount.trim()),
    publisher: values.publisher.trim(),
    title: values.title.trim(),
  }
}

import type { CreateBookBody } from './_generated/models/createBookBody'
import type { DataResponseBookResponse } from './_generated/models/dataResponseBookResponse'
import { customFetch } from './customFetch.api'

export function createBook(
  createBookBody?: CreateBookBody,
  options?: Parameters<typeof customFetch>[1],
): Promise<DataResponseBookResponse> {
  const formData = new FormData()

  if (createBookBody?.book !== undefined) {
    formData.append(
      'book',
      new Blob([JSON.stringify(createBookBody.book)], { type: 'application/json' }),
    )
  }
  if (createBookBody?.coverImage !== undefined) {
    formData.append('coverImage', createBookBody.coverImage)
  }

  return customFetch<DataResponseBookResponse>('/api/books', {
    ...options,
    method: 'POST',
    body: formData,
  })
}

import type { DataResponsePassagesByPage } from './_generated/models/dataResponsePassagesByPage'
import { getGetPassagesByPageUrl } from './_generated/passage/passage'
import { customFetch } from './customFetch.api'

type FetchOptions = Parameters<typeof customFetch>[1]

/**
 * 모임 스코프 대목 조회. 생성된 `getPassagesByPage`에는 쿼리 파라미터 자리가 없어(서버 PR 134 미배포 스펙)
 * URL에 groupId를 직접 붙인다. groupId가 없으면 생성 함수와 같은 URL이다.
 * ponytail: 서버 PR 134 배포 후 `pnpm api:gen`으로 생성 함수가 params를 받게 되면 이 래퍼를 지우고 생성 함수로 돌아간다.
 */
export async function getPassagesByPageScoped(
  bookId: number,
  page: number,
  groupId: number | undefined,
  options?: FetchOptions,
): Promise<DataResponsePassagesByPage> {
  const base = getGetPassagesByPageUrl(bookId, page)
  const url = groupId === undefined ? base : `${base}?groupId=${String(groupId)}`
  return customFetch<DataResponsePassagesByPage>(url, { ...options, method: 'GET' })
}

// URL 쿼리에서 값을 꺼내는 규칙. 같은 키가 여러 번 오면 배열로 들어오는 Next의 searchParams 모양을
// 읽는 쪽마다 다시 풀지 않도록 한곳에 둔다.

/**
 * useSearchParams가 주는 URLSearchParams를 서버 searchParams와 같은 Record 모양으로 바꾼다.
 * 같은 키가 여러 번 오면 서버와 동일하게 배열이 된다 — readParam이 첫 값을 집는 규칙이
 * 어느 쪽에서 읽어도 같은 결과를 내게 하기 위함이다.
 */
export function toSearchParamsRecord(
  searchParams: URLSearchParams,
): Record<string, string | string[]> {
  const record: Record<string, string | string[]> = {}
  for (const key of new Set(searchParams.keys())) {
    const [first, ...rest] = searchParams.getAll(key)
    if (first === undefined) continue
    record[key] = rest.length === 0 ? first : [first, ...rest]
  }
  return record
}

export function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

/** 양의 정수만 통과시킨다 — '1.5', 'abc', '-3'은 모두 무효. */
export function readPositiveInt(
  params: Record<string, string | string[] | undefined>,
  key: string,
): number | undefined {
  const value = readParam(params, key)
  if (value === undefined || !/^\d+$/.test(value)) return undefined
  const parsed = Number(value)
  return parsed > 0 ? parsed : undefined
}

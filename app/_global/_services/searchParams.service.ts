// URL 쿼리에서 값을 꺼내는 규칙. 같은 키가 여러 번 오면 배열로 들어오는 Next의 searchParams 모양을
// 읽는 쪽마다 다시 풀지 않도록 한곳에 둔다.

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

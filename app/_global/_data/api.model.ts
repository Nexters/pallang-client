// API 에러 모델. feature 코드가 `error instanceof ApiError`로 에러 코드를 분기해야 하는데
// `no-restricted-imports`가 `**/_apis/**` import를 막으므로 _apis가 아니라 여기 둔다.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

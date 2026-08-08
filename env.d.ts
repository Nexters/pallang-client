declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- ProcessEnv 선언 병합에는 interface가 필요
  interface ProcessEnv {
    readonly NEXT_PUBLIC_API_URL?: string
    readonly NEXT_PUBLIC_GA_MEASUREMENT_ID?: string
    readonly VERCEL_ENV?: 'development' | 'preview' | 'production'
  }
}

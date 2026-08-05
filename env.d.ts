declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- ProcessEnv 선언 병합에는 interface가 필요
  interface ProcessEnv {
    readonly NEXT_PUBLIC_API_URL?: string
    // 애플 로그인 웹 팝업(Apple JS SDK)용. Apple Developer 콘솔의 Service ID와 등록된 Return URL.
    // 네이티브 iOS는 앱 Bundle ID로 인증하므로 이 값이 없어도 된다.
    readonly NEXT_PUBLIC_APPLE_CLIENT_ID?: string
    readonly NEXT_PUBLIC_APPLE_REDIRECT_URI?: string
  }
}

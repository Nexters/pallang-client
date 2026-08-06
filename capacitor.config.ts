import type { CapacitorConfig } from '@capacitor/cli'

const APP_ID = 'kr.co.pallang.app'
// 기본은 운영. dev 서버를 로드하는 빌드(TestFlight 내부 테스트 등)는 CAP_SERVER_URL로 덮어쓴다.
// apex(pallang.co.kr)는 www로 308 리다이렉트된다. Capacitor iOS는 내부/외부 내비게이션을
// serverURL 문자열 prefix로 판정하므로(함정 4), apex를 박으면 리다이렉트 직후 호스트가 달라져
// 첫 로드부터 외부 판정 → Safari로 튕긴다. 반드시 리다이렉트 이후의 최종 호스트를 쓴다.
const PROD_SERVER_URL = 'https://www.pallang.co.kr'

// dev 라이브리로드: CAP_SERVER_URL=http://<LAN_IP>:3000 pnpm cap:ios / TestFlight dev: pnpm ios:archive:dev
const serverUrl = process.env['CAP_SERVER_URL'] ?? PROD_SERVER_URL

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: 'pallang',
  // 원격 로드라도 존재해야 함 → 기존 public을 최소 fallback으로 사용
  webDir: 'public',
  server: {
    url: serverUrl,
    androidScheme: 'https',
    // http(LAN) 로드일 때만 cleartext 허용
    cleartext: serverUrl.startsWith('http://'),
    // 카카오 OAuth를 웹뷰 안에서 진행시킨다. 목록에 없는 외부 도메인은 시스템 브라우저(Safari)로
    // 열려서 로그인 세션이 앱 밖에 남는다.
    // apex는 www로 넘어가지만, 앱 안에서 apex 링크를 타는 경우를 대비해 함께 허용한다.
    allowNavigation: ['pallang.co.kr', 'kauth.kakao.com', 'accounts.kakao.com'],
  },
  plugins: {
    // 인증 상태(로그인/비로그인) 결정 전까지 비로그인 화면이 깜빡 보이는 것 방지.
    // AuthProvider가 초기화 완료 후 SplashScreen.hide()를 호출한다.
    SplashScreen: {
      launchAutoHide: false,
    },
  },
}

export default config

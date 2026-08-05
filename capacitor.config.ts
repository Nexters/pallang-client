import type { CapacitorConfig } from '@capacitor/cli'

const APP_ID = 'kr.co.pallang.app'
// 기본은 운영. dev 서버를 로드하는 빌드(TestFlight 내부 테스트 등)는 CAP_SERVER_URL로 덮어쓴다.
const PROD_SERVER_URL = 'https://pallang.co.kr'

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
    allowNavigation: ['kauth.kakao.com', 'accounts.kakao.com'],
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

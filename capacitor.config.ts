import type { CapacitorConfig } from '@capacitor/cli'

// 배포 전 실제 값으로 교체할 것
const APP_ID = 'kr.pallang.app'
const PROD_SERVER_URL = 'https://pallang.example.com'

// dev 라이브리로드: CAP_SERVER_URL=http://<LAN_IP>:3000 pnpm cap:ios
const serverUrl = process.env['CAP_SERVER_URL'] ?? PROD_SERVER_URL

// Vercel 프리뷰/dev 배포는 Deployment Protection(SSO) 뒤에 있다. 로그인이 웹뷰 안에서
// 끝나야 인증 쿠키가 앱 쿠키 저장소에 남는다 — Safari로 튕기면 앱은 계속 리다이렉트만 돈다.
// 프로덕션 도메인을 볼 때는 이 예외가 붙지 않는다.
const isProtectedDeployment = /\.vercel\.app|dev\.pallang\.co\.kr/.test(serverUrl)

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
    allowNavigation: [
      'kauth.kakao.com',
      'accounts.kakao.com',
      ...(isProtectedDeployment ? ['vercel.com', '*.vercel.com'] : []),
    ],
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

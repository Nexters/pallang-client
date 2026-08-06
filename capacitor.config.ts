import type { CapacitorConfig } from '@capacitor/cli'

const APP_ID = 'kr.co.pallang.app'
// 기본은 운영. dev 서버를 로드하는 빌드(TestFlight 내부 테스트 등)는 CAP_SERVER_URL로 덮어쓴다.
// 리다이렉트 이후의 최종 호스트를 쓴다(apex는 www로 308). 이유는 docs/capacitor.md 함정 4.
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
    // 인증 상태(로그인/비로그인) 결정 전까지 비로그인 화면이 깜빡 보이는 것 방지 —
    // AuthProvider가 초기화를 마치면 SplashScreen.hide()로 더 일찍 내린다.
    // 상한을 네이티브에 두는 이유: 원격 URL을 로드하므로 네트워크 단절·번들 404처럼
    // JS가 아예 실행되지 않는 실패에서는 웹에 둔 타이머가 걸리지 않는다. 그 경우
    // 스플래시가 영영 남아 "앱 실행 불가"로 읽힌다.
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 5000,
    },
  },
}

export default config

// 부팅 스플래시 제어. 네이티브 스플래시(LaunchScreen storyboard/splash drawable)는 웹 스플래시
// (SplashProvider)와 같은 그림이므로, 걷을 때 fade를 주지 않고 즉시 뗀다 — 아래층의 웹 스플래시가
// 그대로 이어받아 전환이 보이지 않고, 페이드아웃은 웹 스플래시 한 겹만 담당한다(#345).
// capacitor.config.ts의 launchAutoHide: true(5s)는 JS가 아예 실행되지 않는 실패의 상한일 뿐,
// 정상 경로에서는 인증 판정을 마친 AuthProvider가 이 함수로 먼저 내린다.

import { SplashScreen } from '@capacitor/splash-screen'

export async function hideSplashScreen(): Promise<void> {
  try {
    await SplashScreen.hide({ fadeOutDuration: 0 })
  } catch {
    // 웹 브라우저 등 네이티브 스플래시가 없는 환경에선 무시한다.
  }
}

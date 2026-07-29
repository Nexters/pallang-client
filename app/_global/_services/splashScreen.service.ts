// 부팅 스플래시 제어. launchAutoHide: false(capacitor.config.ts)라서
// 인증 상태가 결정된 뒤 AuthProvider가 직접 hide()를 호출해야 스플래시가 사라진다.

import { SplashScreen } from '@capacitor/splash-screen'

export async function hideSplashScreen(): Promise<void> {
  try {
    await SplashScreen.hide()
  } catch {
    // 웹 브라우저 등 네이티브 스플래시가 없는 환경에선 무시한다.
  }
}

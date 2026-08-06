// OS 설정의 앱 권한 화면 열기. 한 번 거부한 권한은 앱에서 다시 물을 수 없어
// (camera.model의 CameraPermissionDeniedError 참고) 사용자를 설정으로 보내는 것이 유일한 복구 경로다.
//
// 네이티브 구현은 두 군데에 있다 — iOS는 native-plugins/app-settings(로컬 Capacitor 패키지),
// Android는 앱 모듈의 AppSettingsPlugin(MainActivity가 registerPlugin으로 등록).
// jsName이 둘 다 'AppSettings'라 웹에서는 하나의 API로 보인다.
//
// 기성 플러그인(capacitor-native-settings)을 쓰지 않는 이유는 그쪽이 비공개 URL 스킴
// `App-prefs:` 문자열 31개를 들고 있어, 호출하지 않아도 바이너리에 남아 심사 정적 검사에
// 걸릴 수 있기 때문이다. 여기서는 애플이 허용하는 openSettingsURLString 하나만 쓴다.

import { Capacitor, registerPlugin } from '@capacitor/core'

type AppSettingsPlugin = {
  openSettings: () => Promise<void>
}

const AppSettings = registerPlugin<AppSettingsPlugin>('AppSettings', {
  // 브라우저에는 열 설정 화면이 없다. 구현이 없으면 registerPlugin이 예외를 던지므로 빈 구현을 준다.
  web: () => ({ openSettings: () => Promise.resolve() }),
})

export async function openAppSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await AppSettings.openSettings()
  } catch (error) {
    // 설정을 못 열어도 화면은 그대로 두고 사용자가 직접 찾아갈 수 있다. 흐름을 끊지 않는다.
    console.error('설정 화면을 열지 못했습니다.', error)
  }
}

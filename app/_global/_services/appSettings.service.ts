// OS 설정의 앱 권한 화면 열기. 한 번 거부한 권한은 앱에서 다시 물을 수 없어
// (CameraPermissionDeniedError 참고) 사용자를 설정으로 보내는 것이 유일한 복구 경로다.

import { Capacitor } from '@capacitor/core'
import { AndroidSettings, IOSSettings, NativeSettings } from 'capacitor-native-settings'

export async function openAppSettings(): Promise<void> {
  // 브라우저에는 열 설정 화면이 없다. 호출부가 플랫폼을 따지지 않도록 여기서 흘린다.
  if (!Capacitor.isNativePlatform()) return
  try {
    await NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App,
    })
  } catch (error) {
    // 설정을 못 열어도 화면은 그대로 두고 사용자가 직접 찾아갈 수 있다. 흐름을 끊지 않는다.
    console.error('설정 화면을 열지 못했습니다.', error)
  }
}

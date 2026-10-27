import { Capacitor } from '@capacitor/core'

export type MobileWebPlatform = 'android' | 'ios'

const APP_STORE_URL = 'https://apps.apple.com/us/app/pallang-%ED%8C%94%EB%9E%91/id6796140451'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=kr.co.pallang.app'

/** 네이티브 앱과 데스크톱을 제외한 모바일 웹의 스토어 플랫폼을 판별한다. */
export function getMobileWebPlatform(): MobileWebPlatform | null {
  if (Capacitor.isNativePlatform()) return null

  const { maxTouchPoints, userAgent } = navigator
  if (/android/i.test(userAgent)) return 'android'
  if (/iPad|iPhone|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) {
    return 'ios'
  }

  return null
}

export function getAppStoreUrl(platform: MobileWebPlatform): string {
  return platform === 'android' ? GOOGLE_PLAY_URL : APP_STORE_URL
}

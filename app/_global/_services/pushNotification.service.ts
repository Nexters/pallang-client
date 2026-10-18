import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'

import {
  type RegisterDeviceTokenRequestPlatform as DeviceTokenPlatform,
  RegisterDeviceTokenRequestPlatform,
  registerNotificationDeviceToken,
  removeNotificationDeviceToken,
} from '../_queries/notification.queries'
import { buildPushNotificationHref } from './notificationNavigation.service'

const PUSH_DEVICE_TOKEN_KEY = 'pallang:push-device-token'

let tokenListenerPromise: Promise<PluginListenerHandle> | null = null
let actionListenerPromise: Promise<PluginListenerHandle> | null = null
let receivedListenerPromise: Promise<PluginListenerHandle> | null = null
let registrationPromise: Promise<void> | null = null
let notificationActionNavigate: ((href: string) => void) | null = null
let notificationReceivedHandler: (() => void) | null = null

export function getPushDevicePlatform(): DeviceTokenPlatform | null {
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') return RegisterDeviceTokenRequestPlatform.IOS
  if (platform === 'android') return RegisterDeviceTokenRequestPlatform.ANDROID
  return null
}

function canUseNativePush(): boolean {
  return Capacitor.isNativePlatform() && getPushDevicePlatform() !== null
}

async function saveRegisteredToken(token: string): Promise<void> {
  await Preferences.set({ key: PUSH_DEVICE_TOKEN_KEY, value: token })
}

async function getRegisteredToken(): Promise<string | null> {
  const result = await Preferences.get({ key: PUSH_DEVICE_TOKEN_KEY })
  return result.value
}

async function clearRegisteredToken(): Promise<void> {
  await Preferences.remove({ key: PUSH_DEVICE_TOKEN_KEY })
}

async function registerToken(token: string): Promise<void> {
  const platform = getPushDevicePlatform()
  if (!platform) return
  await registerNotificationDeviceToken({ token, platform })
  await saveRegisteredToken(token)
}

async function ensureTokenRefreshListener(): Promise<void> {
  tokenListenerPromise ??= FirebaseMessaging.addListener('tokenReceived', (event) => {
    void registerToken(event.token).catch((error: unknown) => {
      console.warn('푸시 토큰 갱신 등록 실패', error)
    })
  })
  await tokenListenerPromise
}

export async function registerPushNotificationActionHandler(
  navigate: (href: string) => void,
): Promise<void> {
  if (!canUseNativePush()) return

  notificationActionNavigate = navigate
  actionListenerPromise ??= FirebaseMessaging.addListener(
    'notificationActionPerformed',
    (event) => {
      notificationActionNavigate?.(buildPushNotificationHref(event.notification.data))
    },
  )
  await actionListenerPromise
}

/**
 * 앱이 열린 상태에서 수신한 알림을 앱 상태에 반영한다. 표시 자체는 네이티브 Firebase
 * 플러그인이 처리하고, 이 리스너는 열린 알림함 캐시를 새 데이터로 갱신하는 용도다.
 */
export async function registerPushNotificationReceivedHandler(
  onReceived: () => void,
): Promise<void> {
  if (!canUseNativePush()) return

  notificationReceivedHandler = onReceived
  receivedListenerPromise ??= FirebaseMessaging.addListener('notificationReceived', () => {
    notificationReceivedHandler?.()
  })
  await receivedListenerPromise
}

export async function registerPushDeviceToken(): Promise<void> {
  if (!canUseNativePush()) return
  registrationPromise ??= registerPushDeviceTokenOnce().finally(() => {
    registrationPromise = null
  })
  return registrationPromise
}

async function registerPushDeviceTokenOnce(): Promise<void> {
  await ensureTokenRefreshListener()
  const support = await FirebaseMessaging.isSupported()
  if (!support.isSupported) return

  const permission = await FirebaseMessaging.requestPermissions()
  if (permission.receive !== 'granted') return

  const { token } = await FirebaseMessaging.getToken()
  if (!token) return
  await registerToken(token)
}

export async function unregisterPushDeviceToken(): Promise<void> {
  if (!canUseNativePush()) return

  const token = await getRegisteredToken()
  if (token) {
    try {
      await removeNotificationDeviceToken(token)
    } catch (error) {
      console.warn('푸시 토큰 삭제 요청 실패', error)
    } finally {
      await clearRegisteredToken()
    }
  }

  try {
    await FirebaseMessaging.deleteToken()
  } catch (error) {
    console.warn('푸시 토큰 로컬 삭제 실패', error)
  }
}

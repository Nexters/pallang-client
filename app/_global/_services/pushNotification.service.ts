import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { FirebaseMessaging } from '@capacitor-firebase/messaging'

import {
  type RegisterDeviceTokenRequestPlatform as DeviceTokenPlatform,
  RegisterDeviceTokenRequestPlatform,
  registerNotificationDeviceToken,
  removeNotificationDeviceToken,
} from '../_queries/notification.queries'

const PUSH_DEVICE_TOKEN_KEY = 'pallang:push-device-token'

let tokenListenerPromise: Promise<PluginListenerHandle> | null = null
let registrationPromise: Promise<void> | null = null

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

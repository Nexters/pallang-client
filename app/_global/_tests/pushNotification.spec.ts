// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { capacitorState, firebaseMessagingMock, preferencesStore } = vi.hoisted(() => ({
  capacitorState: {
    isNative: false,
    platform: 'web',
  },
  firebaseMessagingMock: {
    addListener: vi.fn(),
    deleteToken: vi.fn(),
    getToken: vi.fn(),
    isSupported: vi.fn(),
    requestPermissions: vi.fn(),
  },
  preferencesStore: new Map<string, string>(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => capacitorState.platform,
    isNativePlatform: () => capacitorState.isNative,
  },
}))

vi.mock('@capacitor-firebase/messaging', () => ({
  FirebaseMessaging: firebaseMessagingMock,
}))

vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(({ key }: { key: string }) =>
      Promise.resolve({ value: preferencesStore.get(key) ?? null }),
    ),
    remove: vi.fn(({ key }: { key: string }) => {
      preferencesStore.delete(key)
      return Promise.resolve()
    }),
    set: vi.fn(({ key, value }: { key: string; value: string }) => {
      preferencesStore.set(key, value)
      return Promise.resolve()
    }),
  },
}))

async function importService() {
  return import('../_services/pushNotification.service')
}

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('pushNotification.service', () => {
  beforeEach(() => {
    capacitorState.isNative = false
    capacitorState.platform = 'web'
    preferencesStore.clear()
    firebaseMessagingMock.addListener.mockResolvedValue({ remove: vi.fn() })
    firebaseMessagingMock.deleteToken.mockResolvedValue(undefined)
    firebaseMessagingMock.getToken.mockResolvedValue({ token: 'fcm-token' })
    firebaseMessagingMock.isSupported.mockResolvedValue({ isSupported: true })
    firebaseMessagingMock.requestPermissions.mockResolvedValue({ receive: 'granted' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('웹에서는 푸시 토큰 등록을 하지 않는다', async () => {
    const fetchMock = mockFetch(new Response('{}', { status: 200 }))
    const { registerPushDeviceToken } = await importService()

    await registerPushDeviceToken()

    expect(firebaseMessagingMock.getToken).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('native android에서는 FCM 토큰을 서버에 등록한다', async () => {
    capacitorState.isNative = true
    capacitorState.platform = 'android'
    const fetchMock = mockFetch(new Response('{}', { status: 200 }))
    const { registerPushDeviceToken } = await importService()

    await registerPushDeviceToken()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/device-tokens',
      expect.objectContaining({
        body: JSON.stringify({ token: 'fcm-token', platform: 'ANDROID' }),
        method: 'PUT',
      }),
    )
  })

  it('권한이 거부되면 토큰을 요청하지 않는다', async () => {
    capacitorState.isNative = true
    capacitorState.platform = 'ios'
    firebaseMessagingMock.requestPermissions.mockResolvedValue({ receive: 'denied' })
    const fetchMock = mockFetch(new Response('{}', { status: 200 }))
    const { registerPushDeviceToken } = await importService()

    await registerPushDeviceToken()

    expect(firebaseMessagingMock.getToken).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('푸시 알림을 누르면 data에 맞는 화면으로 이동한다', async () => {
    capacitorState.isNative = true
    capacitorState.platform = 'android'
    type NotificationActionEvent = { actionId: string; notification: { data: unknown } }
    let actionListener: ((event: NotificationActionEvent) => void) | undefined
    firebaseMessagingMock.addListener.mockImplementation(
      (eventName: string, listener: (event: NotificationActionEvent) => void) => {
        if (eventName === 'notificationActionPerformed') actionListener = listener
        return Promise.resolve({ remove: vi.fn() })
      },
    )
    const navigate = vi.fn()
    const { registerPushNotificationActionHandler } = await importService()

    await registerPushNotificationActionHandler(navigate)

    actionListener?.({
      actionId: 'tap',
      notification: {
        data: {
          type: 'OPINION_COMMENTED',
          bookId: '11',
          opinionId: '7',
          commentId: '3',
        },
      },
    })

    expect(navigate).toHaveBeenCalledWith('/trace/11?opinionId=7')
  })

  it('로그아웃 시 저장된 토큰을 서버와 로컬에서 삭제한다', async () => {
    capacitorState.isNative = true
    capacitorState.platform = 'ios'
    preferencesStore.set('pallang:push-device-token', 'old-token')
    const fetchMock = mockFetch(new Response('{}', { status: 200 }))
    const { unregisterPushDeviceToken } = await importService()

    await unregisterPushDeviceToken()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/notifications/device-tokens?token=old-token',
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(firebaseMessagingMock.deleteToken).toHaveBeenCalledOnce()
    expect(preferencesStore.has('pallang:push-device-token')).toBe(false)
  })
})

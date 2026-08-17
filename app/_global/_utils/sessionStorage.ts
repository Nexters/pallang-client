// 웹뷰 프라이빗 모드 등 storage 접근이 막히면 저장만 포기하고 화면 흐름은 계속한다.
function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function getSessionStorageItem(key: string): null | string {
  return safeSessionStorage()?.getItem(key) ?? null
}

export function setSessionStorageItem(key: string, value: string): void {
  safeSessionStorage()?.setItem(key, value)
}

export function removeSessionStorageItem(key: string): void {
  safeSessionStorage()?.removeItem(key)
}

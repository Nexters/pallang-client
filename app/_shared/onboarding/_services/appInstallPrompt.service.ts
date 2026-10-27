const APP_INSTALL_PROMPT_PENDING_STORAGE_KEY = 'pallang:app-install-prompt-pending'

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** 온보딩을 건너뛴 직후 홈에서 한 번만 설치 안내를 띄운다. */
export function markAppInstallPromptPending(): void {
  try {
    safeLocalStorage()?.setItem(APP_INSTALL_PROMPT_PENDING_STORAGE_KEY, '1')
  } catch {
    // 저장할 수 없으면 안내를 생략하고 홈 진입을 계속한다.
  }
}

/** 홈 진입 때 예약된 안내를 가져오면서 바로 소진한다. */
export function consumeAppInstallPrompt(): boolean {
  try {
    const storage = safeLocalStorage()
    if (storage?.getItem(APP_INSTALL_PROMPT_PENDING_STORAGE_KEY) !== '1') return false

    storage.removeItem(APP_INSTALL_PROMPT_PENDING_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

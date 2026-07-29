type LoginGateModalProps = {
  /** 막힌 액션에 맞는 안내 문구 — 문구 선택은 게이트를 호출한 쪽이 정한다 */
  message: string
  onLogin: () => void
  onClose: () => void
}

export function LoginGateModal({ message, onLogin, onClose }: LoginGateModalProps) {
  return (
    // 의견 상세 오버레이(z-20) 안에서 댓글 작성 게이트로도 뜨므로 그 위(z-30)에 그린다
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-78 flex-col gap-4 rounded-[12px] bg-white p-6 text-center"
      >
        <p className="text-title-16sb text-text-secondary">{message}</p>
        <button
          type="button"
          onClick={onLogin}
          className="w-full rounded-full bg-interactive-accent py-3 text-body-14sb text-text-inverse"
        >
          로그인 하러가기
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-body-14rg text-text-secondary opacity-50"
        >
          닫기
        </button>
      </div>
    </div>
  )
}

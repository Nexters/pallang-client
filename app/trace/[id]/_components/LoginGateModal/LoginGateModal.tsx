type LoginGateModalProps = {
  onLogin: () => void
  onClose: () => void
}

export function LoginGateModal({ onLogin, onClose }: LoginGateModalProps) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-6">
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-78 flex-col gap-4 rounded-[12px] bg-white p-6 text-center"
      >
        <p className="text-title-16sb text-text-secondary">
          해당 페이지부터는 로그인해야 확인할 수 있어요!
        </p>
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

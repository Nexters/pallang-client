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
        <p className="text-[16px] leading-[1.4] font-semibold text-[#222]">
          해당 페이지부터는 로그인해야 확인할 수 있어요!
        </p>
        <button
          type="button"
          onClick={onLogin}
          className="w-full rounded-full bg-[#ef5a06] py-3 text-[14px] font-semibold text-white"
        >
          로그인 하러가기
        </button>
        <button type="button" onClick={onClose} className="text-[14px] text-[#222] opacity-50">
          닫기
        </button>
      </div>
    </div>
  )
}

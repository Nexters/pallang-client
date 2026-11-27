/** 책 상세의 독서 상태 설정을 여는 버튼. 데이터가 없을 때는 비활성화한다. */
export function BookEditAction({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className="press flex shrink-0 items-center justify-center rounded-full bg-black/10 px-2.5 py-2 text-body-14sb text-text-primary"
    >
      편집
    </button>
  )
}

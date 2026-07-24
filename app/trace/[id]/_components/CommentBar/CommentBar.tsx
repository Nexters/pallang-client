import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'

export function CommentBar() {
  return (
    // ponytail: border #464646은 디자인 변수 미연결 색이라 토큰 없음 — 토큰 추가 시 치환
    <div className="sticky bottom-0 flex items-center gap-2 border-t border-[#464646] bg-bg-black p-4">
      <input
        type="text"
        placeholder="댓글을 입력해주세요"
        className="min-w-0 flex-1 rounded-full bg-bg-dark px-4 py-[9px] text-body-14rg text-text-inverse outline-none placeholder:text-text-inverse/50"
      />
      <button
        type="button"
        aria-label="댓글 등록"
        className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-interactive-accent"
      >
        <PencilIcon width={20} height={20} className="text-icon-active" />
      </button>
    </div>
  )
}

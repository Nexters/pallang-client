import { Icon } from '../Icon/Icon'

export function CommentBar() {
  return (
    <div className="sticky bottom-0 flex items-center gap-2 border-t border-[#464646] bg-[#111] p-4">
      <input
        type="text"
        placeholder="댓글을 입력해주세요"
        className="min-w-0 flex-1 rounded-full bg-[#222] px-4 py-[9px] text-[14px] tracking-[-0.56px] text-white outline-none placeholder:text-white/50"
      />
      <button
        type="button"
        aria-label="댓글 등록"
        className="flex size-9.5 shrink-0 items-center justify-center rounded-full bg-[#ef5a06]"
      >
        <Icon name="pencil" size={20} />
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'

import CommentIcon from '@/app/_global/_components/Icon/assets/comment.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { cn } from '@/app/_global/_services/cn.service'

type TraceCreateFabProps = {
  /** 보고 있는 대목에 의견을 붙이러 간다 */
  onAddOpinion: () => void
  /** 이 책에 새 대목을 남기러 간다 */
  onAddRecord: () => void
}

/** 우하단 남기기 버튼(디자인 200:979 닫힘 / 200:937 열림).
    닫힘은 +, 열면 같은 버튼이 45° 돌아 ×가 되고 위로 두 갈래가 펼쳐진다. */
export function TraceCreateFab({ onAddOpinion, onAddRecord }: TraceCreateFabProps) {
  const [isOpen, setIsOpen] = useState(false)

  const run = (action: () => void) => () => {
    setIsOpen(false)
    action()
  }

  return (
    <div className="fixed right-6 bottom-[max(24px,var(--safe-bottom))] z-40 flex w-[137px] flex-col items-end gap-2">
      {isOpen && (
        <>
          {/* ponytail: #c6c6c6는 디자인 변수 미연결 색 — 토큰 추가 시 치환 */}
          <button
            type="button"
            onClick={run(onAddOpinion)}
            className="flex w-full items-center justify-center gap-2 rounded-[46px] bg-[#c6c6c6]/50 p-4 text-title-16sb text-text-inverse backdrop-blur-[10px]"
          >
            <CommentIcon width={24} height={24} className="text-icon-active" />
            의견 남기기
          </button>
          <button
            type="button"
            onClick={run(onAddRecord)}
            className="flex w-full items-center justify-center gap-2 rounded-[46px] bg-[#c6c6c6]/50 p-4 text-title-16sb text-text-inverse backdrop-blur-[10px]"
          >
            <PencilIcon width={24} height={24} className="text-icon-active" />
            기록 남기기
          </button>
        </>
      )}
      <button
        type="button"
        aria-label="남기기"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((prev) => !prev)
        }}
        className="flex size-14 items-center justify-center rounded-2xl bg-orange-500 p-4"
      >
        {/* 시안의 열림 상태 아이콘은 +를 √2배로 키운 크기다 = 45° 회전한 같은 글리프 */}
        <PlusIcon
          width={24}
          height={24}
          className={cn(
            'text-icon-active transition-transform duration-fast ease-standard',
            isOpen && 'rotate-45',
          )}
        />
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'

import CommentIcon from '@/app/_global/_components/Icon/assets/comment.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { MOTION_DURATION } from '@/app/_global/_data/motion.constant'
import { useExitTransition } from '@/app/_global/_hooks/useExitTransition'
import { cn } from '@/app/_global/_services/cn.service'

type TraceCreateFabProps = {
  /** 보고 있는 대목에 의견을 붙이러 간다 */
  onAddOpinion: () => void
  /** 이 책에 새 대목을 남기러 간다 */
  onAddRecord: () => void
}

/** 우하단 남기기 버튼.
    닫힘은 +, 열면 같은 버튼이 45° 돌아 ×가 되고 위로 두 갈래가 펼쳐진다. */
export function TraceCreateFab({ onAddOpinion, onAddRecord }: TraceCreateFabProps) {
  const [isOpen, setIsOpen] = useState(false)
  // 갈래는 접자마자 사라지지 않는다 — 퇴장 전환이 보이도록 수명을 늘려 잡는다
  const branches = useExitTransition(isOpen, MOTION_DURATION.fast)

  // 두 갈래는 아이콘·라벨·목적지만 다르다
  const branchItems = [
    { label: '의견 남기기', Icon: CommentIcon, onSelect: onAddOpinion },
    { label: '기록 남기기', Icon: PencilIcon, onSelect: onAddRecord },
  ]

  /* ponytail: #c6c6c6는 디자인 변수 미연결 색 — 토큰 추가 시 치환. 46px 라운드·10px 블러도 같은 시안 값이다 */
  const branchClassName =
    'press flex w-full items-center justify-center gap-2 rounded-[46px] bg-[#c6c6c6]/50 p-4 text-title-16sb text-text-inverse backdrop-blur-[10px]'

  return (
    /* 뷰포트가 아니라 앱 셸(layout의 relative main, max-w-132.5)에 붙는다 —
       fixed로 두면 넓은 화면에서 창 오른쪽 끝으로 떨어져 나가 앱 화면 밖에 뜬다.
       main이 h-dvh라 세로 위치는 fixed일 때와 같고, 스크롤은 안쪽 컨테이너가 맡아 함께 밀리지 않는다.
       하단은 기본 24px, 인셋이 그보다 크면 인셋만큼 올라간다 */
    <div className="absolute right-6 bottom-[max(24px,var(--safe-bottom))] z-40 flex w-[137px] flex-col items-end gap-2">
      {branches.shouldRender && (
        <div
          data-state={branches.state}
          className={cn(
            'flex w-full flex-col items-end gap-2',
            // 버튼 자리에서 밀려 올라오며 드러난다. scale-*/translate-*는 Tailwind v4에서
            // transform이 아니라 각자의 속성으로 컴파일돼 transition에 이름을 그대로 적는다
            'transition-[opacity,translate] duration-fast ease-enter',
            'data-[state=entering]:translate-y-2 data-[state=entering]:opacity-0',
            'data-[state=exiting]:translate-y-2 data-[state=exiting]:opacity-0',
            'data-[state=exiting]:ease-exit',
            // 걷히는 동안에도 화면에 남아 있으므로 탭을 흘려보낸다
            'data-[state=exiting]:pointer-events-none',
          )}
        >
          {branchItems.map(({ label, Icon, onSelect }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setIsOpen(false)
                onSelect()
              }}
              className={branchClassName}
            >
              <Icon width={24} height={24} className="text-icon-active" />
              {label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-label="남기기"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((prev) => !prev)
        }}
        className="press flex size-14 items-center justify-center rounded-2xl bg-interactive-accent p-4"
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

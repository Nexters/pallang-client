'use client'

import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import Image from 'next/image'
import { type ComponentProps, useRef } from 'react'

import { DIALOG_MASCOT_SIZE, DIALOG_MASCOT_SRC } from '@/app/_global/_data/dialogMascot.constant'
import { cn } from '@/app/_global/_services/cn.service'

// ponytail: 버튼 2개 · 버튼 1개 · 일러스트 포함 전체 화면
// 카드 스펙은 세 디자인 모두 동일하고 차이는 Footer 버튼 개수뿐이다.
// shadcn/ui 인터페이스를 따르되 base-ui의 `render` prop을 쓴다(shadcn의 `asChild` 대응).
// AGENTS.md의 "파일당 컴포넌트 1개 export" 규칙을 지키려 Dialog 네임스페이스 객체 하나만 내보낸다.

// NOTE(디자인 확인 필요): 제목·설명 타이포가 globals.css 토큰과 미세하게 어긋난다.
//   제목 Title/M/Bold  = 20px / 700 / lh 1.4  ↔ --text-title-20sb = 20px / 600 / lh 1.5
//   설명 Title/Body/S/Medium = 14px / lh 1.3 / ls -0.04em ↔ --text-body-14md = 14px / lh 1.5 / ls -0.03em
// 기존 토큰을 재사용하고 어긋나는 축만 override 했다. 디자인 확정 후 토큰을 정리하면 override를 걷어낼 것.

// NOTE(디자인 확인 필요): 백드롭 색은 Figma 변수로 지정돼 있지 않다(회색은 목업 캔버스 배경일 수 있음).
// 일단 bg-black 50%로 두었으니 디자인 확정 시 교체할 것.

function Root(props: ComponentProps<typeof BaseDialog.Root>) {
  return <BaseDialog.Root {...props} />
}

function Trigger(props: ComponentProps<typeof BaseDialog.Trigger>) {
  return <BaseDialog.Trigger data-slot="dialog-trigger" {...props} />
}

function Portal(props: ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal {...props} />
}

function Backdrop({ className, ...props }: ComponentProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        'fixed inset-0 z-50 bg-bg-black/50 transition-opacity duration-fast ease-enter',
        'data-starting-style:opacity-0 data-ending-style:opacity-0 data-ending-style:ease-exit',
        className,
      )}
      {...props}
    />
  )
}

function Viewport({ className, ...props }: ComponentProps<typeof BaseDialog.Viewport>) {
  return (
    <BaseDialog.Viewport
      data-slot="dialog-viewport"
      className={cn('fixed inset-0 z-50 flex items-center justify-center px-4', className)}
      {...props}
    />
  )
}

type PopupProps = ComponentProps<typeof BaseDialog.Popup> & {
  /** 일러스트가 겹쳐 올라오는지. 상단 여백이 그 자리라 일러스트와 함께 켜고 끈다. */
  illustrated?: boolean
}

// 카드 본체. 일러스트가 위로 삐져나오므로 relative만 두고 overflow는 자르지 않는다.
function Popup({ className, illustrated = true, initialFocus, ref, ...props }: PopupProps) {
  // base-ui의 기본 initialFocus는 터치로 열 때만 팝업 자신을, 그 외에는 팝업 안 첫 tabbable 요소를
  // 잡는다 — 열자마자 첫 버튼에 포커스 링이 뜬다. 항상 팝업 자신을 잡아 링을 없앤다.
  // `false`(포커스 이동 안 함)는 쓰지 않는다 — 모달이 바깥을 aria-hidden 처리하므로
  // 포커스가 숨겨진 영역에 남아 스크린리더·탭 순서가 깨진다.
  const popupRef = useRef<HTMLDivElement>(null)

  return (
    <BaseDialog.Popup
      data-slot="dialog-popup"
      ref={(node) => {
        popupRef.current = node
        // 조합형이라 바깥에서 ref를 받을 수 있다. 콜백 ref는 정리 함수를 돌려줄 수 있어 그대로 넘긴다.
        if (typeof ref === 'function') return ref(node)
        if (ref) ref.current = node
        return undefined
      }}
      initialFocus={initialFocus ?? popupRef}
      className={cn(
        'relative flex w-full max-w-[343px] flex-col gap-6 rounded-[32px] bg-bg-default px-4 pb-6',
        // 일러스트가 카드 안쪽으로 38px 겹쳐 들어오므로 그만큼 제목을 밀어 둔다
        illustrated ? 'pt-[46px]' : 'pt-6',
        // 포커스를 받는 요소가 되므로 키보드로 열었을 때 링이 그려지지 않게 막는다
        'outline-none',
        // 등장은 넉넉하게, 퇴장은 짧게 — 사라지는 걸 기다리게 하지 않는다
        // Tailwind v4의 scale-*는 transform이 아니라 scale 속성으로 컴파일된다 —
        // transition-property에 transform을 적으면 크기가 전환 없이 점프한다
        'transition-[opacity,scale] duration-normal ease-enter',
        'data-starting-style:scale-95 data-starting-style:opacity-0',
        'data-ending-style:scale-95 data-ending-style:opacity-0',
        'data-ending-style:duration-fast data-ending-style:ease-exit',
        className,
      )}
      {...props}
    />
  )
}

// shadcn의 DialogContent 대응 — Portal + Backdrop + Viewport + Popup을 한 번에 묶은 편의 래퍼.
// 백드롭을 커스터마이즈하려면 Portal/Backdrop/Viewport/Popup을 직접 조합하면 된다.
function Content({ children, ...props }: PopupProps) {
  return (
    <Portal>
      <Backdrop />
      <Viewport>
        <Popup {...props}>{children}</Popup>
      </Viewport>
    </Portal>
  )
}

// 일러스트 없는 형태(차단 해제 확인)는 Popup의 `illustrated={false}`로 만든다 —
// 일러스트를 걷으면 그 자리로 잡아 둔 상단 여백도 같이 줄어야 제목 위가 휑하지 않다.

// 카드 위로 겹쳐 올라가는 일러스트. 기본은 마스코트이고, children을 주면 다른 일러스트로 바꿀 수 있다.
// Figma 기준 카드 안쪽으로 38px 겹치고 가로 중앙 정렬(img 200×145, 카드 상단 -107px).
// bottom을 기준으로 잡아 일러스트 높이가 달라져도 겹침 38px이 유지된다.
function Illustration({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-illustration"
      aria-hidden
      className={cn(
        'pointer-events-none absolute bottom-[calc(100%-38px)] left-1/2 w-[200px] -translate-x-1/2',
        className,
      )}
      {...props}
    >
      {/* 다이얼로그가 열릴 때만 마운트되고 즉시 화면에 보이므로 lazy 로딩할 이유가 없다.
          열림 시점 요청 시작으로 인한 팝인은 DialogMascotPreload(루트 레이아웃)가 선로딩으로 막는다. */}
      {children ?? (
        <Image
          src={DIALOG_MASCOT_SRC}
          alt=""
          {...DIALOG_MASCOT_SIZE}
          loading="eager"
          className="h-auto w-full"
        />
      )}
    </div>
  )
}

function Header({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex w-full flex-col items-center gap-1 text-center text-text-secondary [word-break:break-word]',
        className,
      )}
      {...props}
    />
  )
}

// 제목·설명 문구는 디자인이 정한 자리에서 줄을 바꾼다("지금 나가면\n작성 중이던 흔적이 사라져요").
// 기본값이 normal이면 그 \n이 공백으로 접혀 호출부마다 whitespace-pre-line을 덧붙이게 되고,
// 빠뜨린 곳은 조용히 한 줄로 붙어 버린다 — 여기서 한 번에 켠다. 줄바꿈이 없는 문구는 영향이 없다.
function Title({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn(
        'w-full text-title-20sb font-bold leading-[1.4] whitespace-pre-line',
        className,
      )}
      {...props}
    />
  )
}

function Description({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      className={cn(
        'w-full text-body-14md leading-[1.3] tracking-[-0.04em] whitespace-pre-line',
        className,
      )}
      {...props}
    />
  )
}

// 자식 버튼을 균등 분배한다. 버튼 1개면 풀폭(311px), 2개면 151.5px씩 + gap 8px — 두 디자인 모두 커버.
function Footer({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex w-full gap-2 [&>*]:min-w-0 [&>*]:flex-1', className)}
      {...props}
    />
  )
}

function Close(props: ComponentProps<typeof BaseDialog.Close>) {
  return <BaseDialog.Close data-slot="dialog-close" {...props} />
}

export const Dialog = {
  Root,
  Trigger,
  Portal,
  Backdrop,
  Viewport,
  Popup,
  Content,
  Illustration,
  Header,
  Title,
  Description,
  Footer,
  Close,
}

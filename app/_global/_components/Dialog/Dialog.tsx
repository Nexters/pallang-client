'use client'

import { Dialog as BaseDialog } from '@base-ui/react/dialog'
import Image from 'next/image'
import type { ComponentProps } from 'react'

import { cn } from '@/app/_global/_services/cn.service'

// Figma 2500:8761(Group 2147220874) export를 200×145 컨테이너 기준 2x(400×290)로 리사이즈한 것.
// 벡터(흰 눈·배)와 PNG가 합성된 상태여야 한다 — PNG만 쓰면 눈이 투명해져 뒤 백드롭이 비친다.
const MASCOT_SRC = '/images/mascot-pair.png'
const MASCOT_SIZE = { width: 200, height: 145 }

// ponytail: Figma 2545:7228(버튼 2개) · 2224:19102(버튼 1개) · 2260:6966(일러스트 포함 전체 화면)
// 카드 스펙은 세 디자인 모두 동일하고 차이는 Footer 버튼 개수뿐이다.
// shadcn/ui 인터페이스를 따르되 base-ui의 `render` prop을 쓴다(shadcn의 `asChild` 대응).
// AGENTS.md의 "파일당 컴포넌트 1개 export" 규칙을 지키려 Dialog 네임스페이스 객체 하나만 내보낸다.

// NOTE(디자인 확인 필요): 제목·설명 타이포가 globals.css 토큰과 미세하게 어긋난다.
//   제목 Title/M/Bold  = 20px / 700 / lh 1.4  ↔ --text-title-20sb = 20px / 600 / lh 1.5
//   설명 Title/Body/S/Medium = 14px / lh 1.3 / ls -0.04em ↔ --text-body-14md = 14px / lh 1.5 / ls -0.03em
// 기존 토큰을 재사용하고 어긋나는 축만 override 했다. 디자인 확정 후 토큰을 정리하면 override를 걷어낼 것.

// NOTE(디자인 확인 필요): 백드롭 색은 Figma 변수로 지정돼 있지 않다(2260:6966의 회색은 목업 캔버스 배경일 수 있음).
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
        'fixed inset-0 z-50 bg-bg-black/50 transition-opacity duration-200',
        'data-starting-style:opacity-0 data-ending-style:opacity-0',
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

// 카드 본체. 일러스트가 위로 삐져나오므로 relative만 두고 overflow는 자르지 않는다.
function Popup({ className, ...props }: ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <BaseDialog.Popup
      data-slot="dialog-popup"
      className={cn(
        'relative flex w-full max-w-[343px] flex-col gap-6 rounded-[32px] bg-bg-default px-4 pt-[46px] pb-6',
        'transition-[opacity,transform] duration-200',
        'data-starting-style:scale-95 data-starting-style:opacity-0',
        'data-ending-style:scale-95 data-ending-style:opacity-0',
        className,
      )}
      {...props}
    />
  )
}

// shadcn의 DialogContent 대응 — Portal + Backdrop + Viewport + Popup을 한 번에 묶은 편의 래퍼.
// 백드롭을 커스터마이즈하려면 Portal/Backdrop/Viewport/Popup을 직접 조합하면 된다.
function Content({ children, ...props }: ComponentProps<typeof BaseDialog.Popup>) {
  return (
    <Portal>
      <Backdrop />
      <Viewport>
        <Popup {...props}>{children}</Popup>
      </Viewport>
    </Portal>
  )
}

// TODO(design): 일러스트 없는 다이얼로그 디자인이 나오면 반영할 것.
// 지금은 일러스트가 항상 있는 전제라 Popup의 pt-[46px]도 일러스트 자리로 고정돼 있다.
// 없는 버전이 생기면 상단 여백까지 함께 분기해야 한다.

// 카드 위로 겹쳐 올라가는 일러스트. 기본은 마스코트이고, children을 주면 다른 일러스트로 바꿀 수 있다.
// Figma 기준 카드 안쪽으로 38px 겹치고 가로 중앙 정렬(2260:6966 — img 200×145, 카드 상단 -107px).
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
      {/* 다이얼로그가 열릴 때만 마운트되고 즉시 화면에 보이므로 lazy 로딩할 이유가 없다 */}
      {children ?? (
        <Image src={MASCOT_SRC} alt="" {...MASCOT_SIZE} loading="eager" className="h-auto w-full" />
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

function Title({ className, ...props }: ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn('w-full text-title-20sb font-bold leading-[1.4]', className)}
      {...props}
    />
  )
}

function Description({ className, ...props }: ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      className={cn('w-full text-body-14md leading-[1.3] tracking-[-0.04em]', className)}
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

'use client'

import type { FC, SVGProps } from 'react'

import { BottomSheet } from '@/app/_global/_components/BottomSheet/BottomSheet'
import CameraIcon from '@/app/_global/_components/Icon/assets/camera.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import { cn } from '@/app/_global/_services/cn.service'

import type { SelectedBook } from '../../_types/traceDraft.type'

type SourceOptionProps = {
  description: string
  /** 시안이 기본 수단으로 세워 둔 카드(사진으로 입력)는 어두운 배경 + 흰 글씨로 그린다. */
  emphasized?: boolean
  icon: FC<SVGProps<SVGSVGElement>>
  onClick: () => void
  title: string
}

function SourceOption({
  description,
  emphasized = false,
  icon: Icon,
  onClick,
  title,
}: SourceOptionProps) {
  return (
    // 시안 3077:16085 — 두 카드는 같은 모양이 아니다. 사진으로 입력이 기본 수단이라
    // 어두운 배경에 흰 글씨로 세워 두고, 직접 입력만 밝은 카드로 남는다.
    // 밝은 카드는 누르는 동안 어두운 쪽과 같은 모습으로 뒤집힌다(시안 2135:3707·2137:3764).
    // 이미 어두운 카드는 뒤집을 곳이 없어 press의 눌림만으로 피드백을 준다.
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'press group flex h-[156px] min-w-px flex-1 cursor-pointer flex-col items-end justify-between overflow-hidden p-5 text-left',
        emphasized ? 'bg-bg-dark' : 'bg-bg-surface active:bg-bg-dark',
      )}
    >
      <span className="flex w-full flex-col gap-1.5">
        <span
          className={cn(
            'text-title-18bd',
            emphasized ? 'text-text-inverse' : 'text-text-secondary group-active:text-text-inverse',
          )}
        >
          {title}
        </span>
        <span
          className={cn(
            'whitespace-pre-line text-body-14rg',
            emphasized
              ? 'text-text-inverse/50'
              : 'text-text-tertiary group-active:text-text-inverse/50',
          )}
        >
          {description}
        </span>
      </span>
      <Icon
        aria-hidden="true"
        className={cn(
          'size-[30px] shrink-0',
          emphasized ? 'text-icon-accent' : 'text-icon-primary group-active:text-icon-accent',
        )}
      />
    </button>
  )
}

type TraceSourceSheetProps = {
  open: boolean
  book?: SelectedBook | null
  onClose: () => void
  onSelectPhoto: () => void
  onSelectManual: () => void
}

export function TraceSourceSheet({
  open,
  book,
  onClose,
  onSelectPhoto,
  onSelectManual,
}: TraceSourceSheetProps) {
  return (
    <BottomSheet open={open} title="새로운 기록을 어떻게 남길까요?" onClose={onClose}>
      {book && (
        <div className="flex flex-col gap-2">
          {/* text-body-12md·text-body-12rg는 존재하지 않는 토큰이라 클래스가 생성되지 않았고,
              그 자리의 글씨가 12px이 아니라 상속값(16px)으로 그려지고 있었다.
              12px 토큰은 text-caption-12rg 하나뿐이다. */}
          <span className="w-fit rounded-full bg-interactive-accent px-2 py-1 text-caption-12rg text-text-inverse">
            지금 기록을 남기는 책
          </span>
          <div className="flex items-center gap-3 rounded-lg bg-bg-surface p-3">
            {book.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 커버 도메인이 next.config에 등록되어 있지 않다
              <img
                src={book.coverImageUrl}
                alt=""
                className="h-12 w-9 rounded-[2px] object-cover"
              />
            ) : (
              <span className="h-12 w-9 rounded-[2px] bg-bg-gray" />
            )}
            <span className="flex min-w-px flex-col">
              <span className="truncate text-body-14md text-text-secondary">{book.title}</span>
              <span className="truncate text-caption-12rg text-text-tertiary">{book.author}</span>
            </span>
          </div>
        </div>
      )}
      <div className="flex items-start gap-2">
        <SourceOption
          emphasized
          title="사진으로 입력"
          description={'책 사진을 찍어\n문장을 인식해요'}
          icon={CameraIcon}
          onClick={onSelectPhoto}
        />
        <SourceOption
          title="직접 입력"
          description={'문장을 손으로\n타이핑해요'}
          icon={PencilIcon}
          onClick={onSelectManual}
        />
      </div>
    </BottomSheet>
  )
}

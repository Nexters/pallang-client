'use client'

import Image from 'next/image'
import type { FC, SVGProps } from 'react'

import CameraIcon from '@/app/_global/_components/Icon/assets/camera.svg'
import PencilIcon from '@/app/_global/_components/Icon/assets/pencil.svg'
import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'

type SourceOptionProps = {
  description: string
  icon: FC<SVGProps<SVGSVGElement>>
  onClick: () => void
  title: string
}

function SourceOption({ description, icon: Icon, onClick, title }: SourceOptionProps) {
  return (
    // 시안의 '사진으로 클릭'·'직접 클릭' — 누르는 동안 어두운 배경으로
    // 뒤집히고 아이콘만 오렌지로 산다. 자식 색은 group-active로 같이 넘긴다.
    // 두 카드는 같은 모양이다. 한쪽만 어둡게 두면 눌려 있는 것으로 읽힌다.
    <button
      type="button"
      onClick={onClick}
      className="press group flex h-[156px] min-w-px flex-1 cursor-pointer flex-col items-end justify-between overflow-hidden bg-bg-surface p-5 text-left active:bg-bg-dark"
    >
      <span className="flex w-full flex-col gap-1.5">
        <span className="text-title-18bd text-text-secondary group-active:text-text-inverse">
          {title}
        </span>
        <span className="whitespace-pre-line text-body-14rg text-text-tertiary group-active:text-text-inverse/50">
          {description}
        </span>
      </span>
      <Icon
        aria-hidden="true"
        className="size-[30px] shrink-0 text-icon-primary group-active:text-icon-accent"
      />
    </button>
  )
}

type TraceSourceOptionsProps = {
  book?: SelectedBook | null
  onSelectPhoto: () => void
  onSelectManual: () => void
}

/** 방식 선택 화면의 본문. 시트 껍데기는 이 화면을 담는 TraceSourceView가 갖는다. */
export function TraceSourceOptions({
  book,
  onSelectPhoto,
  onSelectManual,
}: TraceSourceOptionsProps) {
  return (
    <>
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
              <Image
                src={book.coverImageUrl}
                alt=""
                width={36}
                height={48}
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
    </>
  )
}

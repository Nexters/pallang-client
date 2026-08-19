'use client'

import { useEffect, useId, useState } from 'react'

import SearchIcon from '@/app/_global/_components/Icon/assets/search.svg'
import { useHardwareBackRegistry } from '@/app/_global/_hooks/useHardwareBackRegistry'
import { BookSearchSheet } from '@/app/_shared/book/_components/BookSearchSheet/BookSearchSheet'
import { SelectedBookCard } from '@/app/_shared/book/_components/SelectedBookCard/SelectedBookCard'
import type { SelectedBook } from '@/app/_shared/book/_data/selectedBook.model'

import { MeetingField } from '../MeetingField/MeetingField'

type MeetingBookFieldProps = {
  value: SelectedBook | null
  onChange: (book: SelectedBook) => void
  /** 방 설정 변경 — 책은 바꿀 수 없다(API). 편집 없는 카드 + 안내 */
  locked?: boolean
}

/**
 * 책 선택 필드. 비어 있으면 검색창 모양의 버튼(시안 3321:28121 — 입력이 아니라 시트를 여는 트리거라 button),
 * 고르면 SelectedBookCard(편집하기 pill → 시트 재진입).
 * 시트 층은 여기서 하드웨어 뒤로가기에 등록하고, 시트 안 등록 폼 층은 시트가 onRegisterBack으로 등록한다.
 */
export function MeetingBookField({ value, onChange, locked = false }: MeetingBookFieldProps) {
  const labelId = useId()
  // 버튼의 접근성 이름 = 라벨 + 본문(플레이스홀더) — 라벨만 이으면 이름이 '책 선택'뿐이라 무엇을 고르는지 읽히지 않는다
  const textId = useId()
  const [open, setOpen] = useState(false)
  const { register } = useHardwareBackRegistry()

  useEffect(() => {
    if (!open) return
    return register(() => {
      setOpen(false)
    })
  }, [open, register])

  const helperText = locked ? '선택한 책은 변경할 수 없어요.' : undefined

  return (
    <MeetingField label="책 선택" required labelId={labelId} helperText={helperText}>
      {value ? (
        <SelectedBookCard
          book={value}
          onEdit={
            locked
              ? undefined
              : () => {
                  setOpen(true)
                }
          }
        />
      ) : (
        <button
          type="button"
          aria-labelledby={`${labelId} ${textId}`}
          onClick={() => {
            setOpen(true)
          }}
          className="press flex h-14 w-full items-center gap-2 rounded-2xl bg-bg-surface p-4 text-left"
        >
          <SearchIcon className="size-6 shrink-0 text-icon-primary" />
          <span id={textId} className="flex-1 truncate text-body-16md text-text-placeholder-a50">
            모임에서 읽을 책을 선택해주세요.
          </span>
        </button>
      )}
      {!locked && (
        <BookSearchSheet
          open={open}
          title="책 선택하기"
          onClose={() => {
            setOpen(false)
          }}
          onSelect={(book) => {
            onChange(book)
            setOpen(false)
          }}
          onRegisterBack={register}
        />
      )}
    </MeetingField>
  )
}

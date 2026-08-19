import type { ReactNode } from 'react'

type MeetingFieldProps = {
  label: string
  required?: boolean
  /** 입력 아래 중립 안내(시안 "최대 15자까지 가능해요.") — 에러가 아니라 회색이다 */
  helperText?: string
  /** 라벨이 가리킬 입력 id(네이티브 input일 때). 버튼/커스텀 트리거는 aria-labelledby로 잇는다 */
  htmlFor?: string
  labelId?: string
  children: ReactNode
}

/**
 * 시안 필드 블록: 라벨(14md, 별표 오렌지 gap 2) ─8px─ 입력 ─4px─ 헬퍼(14md 회색).
 * Textfield는 라벨-입력 4px·헬퍼 슬롯 없음이라 이 지면 규격(8/4)을 따로 둔다. Textfield에 gap·helperText 옵션을 주는 것은 DS 승격 후보.
 */
export function MeetingField({
  label,
  required,
  helperText,
  htmlFor,
  labelId,
  children,
}: MeetingFieldProps) {
  return (
    <div className="flex w-full flex-col gap-1">
      <div className="flex flex-col gap-2">
        <label
          id={labelId}
          htmlFor={htmlFor}
          className="flex items-start gap-0.5 text-body-14md text-text-secondary"
        >
          {label}
          {required && (
            <span aria-hidden className="font-bold text-interactive-required">
              *
            </span>
          )}
        </label>
        {children}
      </div>
      {helperText && <p className="text-body-14md text-text-tertiary">{helperText}</p>}
    </div>
  )
}

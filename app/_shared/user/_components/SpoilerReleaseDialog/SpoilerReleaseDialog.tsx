'use client'

import { FlatDialog } from '@/app/_global/_components/FlatDialog/FlatDialog'

type SpoilerReleaseDialogProps = {
  open: boolean
  onCancel: () => void
}

/**
 * 스포일러 해제 확인 다이얼로그(Figma 225:13010 · 책 상세 225:13669).
 * 문구는 시안이 정한 자리에서 줄을 바꾼다 — Dialog가 pre-line이다.
 *
 * ponytail: 확정 버튼은 죽여 둔다. 스포일러를 되돌리는 `PATCH /api/passages/{passageId}/spoiler`가
 * 서버에 아직 없어 지금 눌러도 보낼 곳이 없다. API가 생기면 (1) `_apis`를 재생성하고
 * (2) `user.queries.ts`에 mutationOptions를 더한 뒤 (3) 이 컴포넌트에 `onConfirm`을 받아
 * 성공 시 `spoilerPassageList`를 무효화하면 된다. `confirmDisabled`만 걷어내면 나머지는 그대로다.
 */
export function SpoilerReleaseDialog({ open, onCancel }: SpoilerReleaseDialogProps) {
  return (
    <FlatDialog
      open={open}
      illustrated={false}
      title={'해당 문장의 스포일러를\n해제하시겠습니까?'}
      description={'스포일러 해제 시\n해당 문장이 다른 유저들에게 바로 보이게 됩니다.'}
      cancelLabel="뒤로"
      confirmLabel="스포일러 해제"
      confirmDisabled
      onCancel={onCancel}
    />
  )
}

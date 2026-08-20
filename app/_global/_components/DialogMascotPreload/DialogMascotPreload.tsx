import { getImageProps } from 'next/image'
import { preload } from 'react-dom'

import { DIALOG_MASCOT_SIZE, DIALOG_MASCOT_SRC } from '@/app/_global/_data/dialogMascot.constant'

// 다이얼로그 마스코트(Dialog.Illustration)는 다이얼로그가 열리는 순간에야 마운트돼
// 이미지 요청도 그때 시작된다 — 카드·문구가 먼저 뜨고 마스코트만 늦게 얹히는 팝인의 원인.
// 실제 <Image>가 만들 optimizer srcset을 getImageProps로 그대로 계산해 미리 받아 둔다.
// 임의 URL을 preload하면 w·q 파라미터가 달라 재사용되지 않으므로 반드시 이 경로를 거친다.
export function DialogMascotPreload() {
  const { props } = getImageProps({ alt: '', src: DIALOG_MASCOT_SRC, ...DIALOG_MASCOT_SIZE })
  preload(props.src, { as: 'image', fetchPriority: 'low', imageSrcSet: props.srcSet })
  return null
}

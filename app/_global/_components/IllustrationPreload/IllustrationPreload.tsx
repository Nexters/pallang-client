import { DIALOG_MASCOT_SIZE, DIALOG_MASCOT_SRC } from '@/app/_global/_data/dialogMascot.constant'
import {
  FEEDBACK_ILLUSTRATION_SIZE,
  FEEDBACK_ILLUSTRATION_SRC,
} from '@/app/_global/_data/feedbackIllustration.constant'
import { preloadImage } from '@/app/_global/_services/preloadImage.service'

// 열림·판정 시점에야 마운트돼 그때서야 요청이 시작되는 "앱 전역 공용" 일러스트만 등록한다.
// - 다이얼로그 마스코트: 다이얼로그가 열려야 마운트 — 카드·문구 위로 마스코트만 늦게 얹히는 팝인.
// - FeedbackState 일러스트: 에러·빈 판정 후 마운트 — 특히 에러는 네트워크가 불안정할 때 뜨므로
//   그 순간 받으러 가면 늦거나 아예 못 그린다. 미리 캐시에 있어야 에러 화면이 온전하다.
// 특정 화면 전용 일러스트(예: WithdrawDialog)는 전역이 아니라 트리거 화면에서 선로딩한다.
const ILLUSTRATIONS = [
  { src: DIALOG_MASCOT_SRC, ...DIALOG_MASCOT_SIZE },
  { src: FEEDBACK_ILLUSTRATION_SRC, ...FEEDBACK_ILLUSTRATION_SIZE },
]

export function IllustrationPreload() {
  ILLUSTRATIONS.forEach(preloadImage)
  return null
}

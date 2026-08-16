import LikeIcon from '@/app/_global/_components/Icon/assets/like.svg'
import { LOGIN_GATE_MESSAGE } from '@/app/_global/_data/loginGate.constant'
import { useLoginGate } from '@/app/_global/_providers/LoginGateProvider/LoginGateProvider'
import { cn } from '@/app/_global/_services/cn.service'

import { useOpinionLike } from '../../_hooks/useOpinionLike'
import { formatCount } from '../../_services/traceFormat.service'

type TraceLikeButtonProps = {
  opinionId: number
  /** 서버 목록이 준 좋아요 수 — 아직 눌러본 적 없는 흔적의 기준값이다 */
  likeCount: number
  /** 수 앞에 붙는 말. 상세 오버레이만 '공감'을 붙인다 */
  countLabel?: string
  className?: string
}

/**
 * 흔적 좋아요 버튼. 목록 카드와 상세 오버레이가 같은 버튼을 쓴다 —
 * 좋아요 캐시(useOpinionLike)와 비로그인 게이트를 여기 한 곳에서만 걸어 두 자리가 어긋나지 않게 한다.
 */
export function TraceLikeButton({
  opinionId,
  likeCount,
  countLabel,
  className,
}: TraceLikeButtonProps) {
  const runWithLogin = useLoginGate()
  const like = useOpinionLike(opinionId, likeCount)

  return (
    <button
      type="button"
      aria-label="좋아요"
      aria-pressed={like.isLiked}
      onClick={() => {
        runWithLogin(like.toggle, LOGIN_GATE_MESSAGE.like)
      }}
      className={cn('flex items-center gap-0.5 text-body-14rg text-text-inverse', className)}
    >
      <LikeIcon
        width={20}
        height={20}
        className={like.isLiked ? 'text-icon-accent' : 'text-icon-active'}
      />
      {countLabel !== undefined && `${countLabel} `}
      {formatCount(like.likeCount)}
    </button>
  )
}

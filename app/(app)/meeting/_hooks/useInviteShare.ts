'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { ApiError } from '@/app/_global/_data/api.model'
import { groupQueries, type GroupSummary } from '@/app/_global/_queries/group.queries'

import {
  buildInviteUrl,
  type InviteShareOutcome,
  shareInviteLink,
} from '../_services/inviteLink.service'

const OUTCOME_MESSAGE: Record<InviteShareOutcome, string> = {
  shared: '',
  cancelled: '',
  copied: '초대 링크를 복사했어요.',
  failed: '초대 링크를 공유하지 못했어요. 잠시 후 다시 시도해주세요.',
}

/**
 * 초대 링크 보내기 — 초대 코드는 모임장만 받을 수 있어(403) 누를 때 fetchQuery로 받는다(캐시되면 재사용).
 * 공유 결과 문구는 스낵바로 올려보낸다(화면 로컬 Snackbar 패턴).
 */
export function useInviteShare() {
  const queryClient = useQueryClient()
  const [isSharing, setIsSharing] = useState(false)
  const [message, setMessage] = useState('')

  const share = async (group: GroupSummary) => {
    setIsSharing(true)
    try {
      const response = await queryClient.fetchQuery(groupQueries.inviteLink(group.groupId))
      const inviteCode = response.data?.inviteCode
      if (!inviteCode) {
        setMessage(OUTCOME_MESSAGE.failed)
        return
      }
      const outcome = await shareInviteLink({
        title: '팔랑 모임 초대',
        text: `'${group.name}' 모임에 초대합니다.`,
        url: buildInviteUrl(inviteCode, window.location.origin),
      })
      setMessage(OUTCOME_MESSAGE[outcome])
    } catch (error) {
      setMessage(
        error instanceof ApiError && error.status === 403
          ? '모임장만 초대 링크를 보낼 수 있어요.'
          : OUTCOME_MESSAGE.failed,
      )
    } finally {
      setIsSharing(false)
    }
  }

  return {
    share,
    isSharing,
    message,
    closeMessage: () => {
      setMessage('')
    },
  }
}

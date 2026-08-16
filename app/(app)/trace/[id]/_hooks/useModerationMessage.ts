'use client'

import { use } from 'react'

import {
  ModerationMessageContext,
  type ModerationMessageSink,
} from '../_data/moderationMessage.store'

/** 신고·차단 결과 문구를 띄운다. 그리는 자리는 ModerationMessageHost가 든다. */
export function useModerationMessage(): ModerationMessageSink {
  const sink = use(ModerationMessageContext)
  if (!sink) {
    throw new Error('useModerationMessage는 ModerationMessageHost 내부에서만 사용할 수 있습니다.')
  }
  return sink
}

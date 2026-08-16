'use client'

import { use } from 'react'

import { TraceMessageContext, type TraceMessageSink } from '../_data/traceMessage.store'

/** 흔적 보기 화면의 안내 문구를 띄운다. 그리는 자리는 TraceMessageHost가 든다. */
export function useTraceMessage(): TraceMessageSink {
  const sink = use(TraceMessageContext)
  if (!sink) {
    throw new Error('useTraceMessage는 TraceMessageHost 내부에서만 사용할 수 있습니다.')
  }
  return sink
}

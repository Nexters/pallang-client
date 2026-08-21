import { useState } from 'react'

import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { Spinner } from '@/app/_global/_components/Spinner/Spinner'
import { cn } from '@/app/_global/_services/cn.service'

import { useTraceComments } from '../../_hooks/useTraceComments'
import { CommentThread } from '../CommentThread/CommentThread'
import { TraceReplySheet } from '../TraceReplySheet/TraceReplySheet'

type TraceCommentSectionProps = {
  opinionId: number
}

/**
 * 목록을 대신하는 자리(로딩·오류·빈 목록)는 모두 같은 상자다 — 높이가 다르면 상태가 넘어갈 때마다
 * 아래 흔적들이 밀려 올라왔다 내려간다. 크기는 빈 목록 카드(디자인의 128px)에 맞춘다.
 */
const PLACEHOLDER_BOX = 'flex h-32 flex-col items-center justify-center bg-bg-overlay p-4'

/**
 * 흔적 아이템 바로 아래에 인라인으로 펼쳐지는 댓글 묶음.
 * 댓글은 5개까지 보이고 더보기를 누를 때마다 5개씩 이어 붙는다(디자인 주석).
 */
export function TraceCommentSection({ opinionId }: TraceCommentSectionProps) {
  const {
    comments,
    myUserId,
    view,
    isFetching,
    hasInlineError,
    retryAction,
    retry,
    canLoadMore,
    isLoadingMore,
    loadMore,
    update,
    remove,
  } = useTraceComments(opinionId)
  // 답글 시트가 보고 있는 원댓글 — id로 들고 최신 객체는 목록에서 찾는다.
  // 객체 스냅샷을 들면 답글을 단 뒤에도 제목의 개수·미리보기가 낡은 채 남는다.
  // 댓글 시트가 내려가면 이 컴포넌트째 언마운트되므로(BottomSheet는 닫히면 내용을 걷는다)
  // 답글 시트도 함께 접히고, 다시 열면 처음부터 시작한다 — 별도 리셋이 필요 없다
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null)
  const replyTarget = comments.find((comment) => comment.commentId === replyTargetId) ?? null

  if (view === 'pending') {
    return (
      <section aria-label="댓글 목록" aria-busy="true" className="flex flex-col pb-4">
        <div className={PLACEHOLDER_BOX}>
          <Spinner className="text-text-inverse/50" />
        </div>
      </section>
    )
  }

  // 실패를 그냥 두면 빈 상자만 남아 "댓글 없음"과 구분되지 않는다
  if (view === 'error') {
    return (
      <section aria-label="댓글 목록" className="flex flex-col pb-4">
        <div className={cn(PLACEHOLDER_BOX, 'gap-2 text-body-14rg text-text-inverse/50')}>
          <p>댓글을 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={retry}
            className="text-body-14sb text-text-inverse underline"
          >
            댓글 다시 불러오기
          </button>
        </div>
      </section>
    )
  }

  // 빈 목록을 그냥 두면 의견 카드 바로 아래에 다음 요소가 붙어 "댓글이 없다"는 사실이 화면에
  // 남지 않는다 — 디자인은 같은 자리에 첫 댓글을 권하는 카드를 세워 둔다
  if (view === 'empty') {
    return (
      <section
        aria-label="댓글 목록"
        aria-busy={isFetching || undefined}
        className="flex flex-col pb-4"
      >
        <div
          className={cn(
            PLACEHOLDER_BOX,
            'text-center text-body-14md leading-[1.3] tracking-[-0.04em] text-text-inverse',
          )}
        >
          <p>아직 남겨진 댓글이 없습니다.</p>
          <p>첫번째 댓글을 달아주세요!</p>
        </div>
      </section>
    )
  }

  return (
    <section
      aria-label="댓글 목록"
      aria-busy={isFetching || undefined}
      className="flex flex-col gap-0.5 pb-4"
    >
      {comments.map((comment) => (
        <CommentThread
          key={comment.commentId}
          comment={comment}
          myUserId={myUserId}
          onUpdate={update}
          onRemove={remove}
          onOpenReplies={setReplyTargetId}
        />
      ))}
      <TraceReplySheet
        opinionId={opinionId}
        comment={replyTarget}
        myUserId={myUserId}
        onUpdate={update}
        onRemove={remove}
        onClose={() => {
          setReplyTargetId(null)
        }}
      />
      {/* 데이터가 있는 상태의 실패는 목록을 지우지 않고 더보기 자리에서만 알린다 */}
      {hasInlineError ? (
        <button
          type="button"
          disabled={isFetching}
          onClick={retry}
          className="w-full bg-bg-black p-4 text-center text-body-14rg text-text-inverse/50"
        >
          {retryAction === 'fetchNext'
            ? '댓글을 더 불러오지 못했어요. 다시 시도'
            : '댓글을 갱신하지 못했어요. 다시 시도'}
        </button>
      ) : (
        canLoadMore && (
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={loadMore}
            className="flex w-full items-center justify-center gap-2 bg-bg-black p-4 text-body-16md text-text-inverse"
          >
            댓글 더보기
            <PlusIcon width={20} height={20} className="text-icon-active" />
          </button>
        )
      )}
    </section>
  )
}

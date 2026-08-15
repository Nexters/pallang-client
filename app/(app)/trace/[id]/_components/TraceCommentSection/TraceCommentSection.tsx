import PlusIcon from '@/app/_global/_components/Icon/assets/plus.svg'
import { Spinner } from '@/app/_global/_components/Spinner/Spinner'
import { cn } from '@/app/_global/_services/cn.service'

import {
  COMMENT_EMPTY_PROMPT,
  COMMENT_EMPTY_TITLE,
  COMMENT_FETCH_NEXT_ERROR_TEXT,
  COMMENT_LIST_ERROR_TEXT,
  COMMENT_LIST_RETRY_TEXT,
  COMMENT_MORE_TEXT,
  COMMENT_PLACEHOLDER_BOX,
  COMMENT_REFETCH_ERROR_TEXT,
} from '../../_data/commentList.constant'
import { useTraceComments } from '../../_hooks/useTraceComments'
import { CommentThread } from '../CommentThread/CommentThread'

type TraceCommentSectionProps = {
  opinionId: number
}

/**
 * 흔적 아이템 바로 아래에 인라인으로 펼쳐지는 댓글 묶음.
 * 댓글은 5개까지 보이고 더보기를 누를 때마다 5개씩 이어 붙는다(디자인 2165:5125 주석).
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

  if (view === 'pending') {
    return (
      <section aria-label="댓글 목록" aria-busy="true" className="flex flex-col pb-4">
        <div className={COMMENT_PLACEHOLDER_BOX}>
          <Spinner className="text-text-inverse/50" />
        </div>
      </section>
    )
  }

  if (view === 'error') {
    return (
      <section aria-label="댓글 목록" className="flex flex-col pb-4">
        <div className={cn(COMMENT_PLACEHOLDER_BOX, 'gap-2 text-body-14rg text-text-inverse/50')}>
          <p>{COMMENT_LIST_ERROR_TEXT}</p>
          <button
            type="button"
            onClick={retry}
            className="text-body-14sb text-text-inverse underline"
          >
            {COMMENT_LIST_RETRY_TEXT}
          </button>
        </div>
      </section>
    )
  }

  if (view === 'empty') {
    return (
      <section
        aria-label="댓글 목록"
        aria-busy={isFetching || undefined}
        className="flex flex-col pb-4"
      >
        <div
          className={cn(
            COMMENT_PLACEHOLDER_BOX,
            'text-center text-body-14md leading-[1.3] tracking-[-0.04em] text-text-inverse',
          )}
        >
          <p>{COMMENT_EMPTY_TITLE}</p>
          <p>{COMMENT_EMPTY_PROMPT}</p>
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
        />
      ))}
      {hasInlineError ? (
        <button
          type="button"
          disabled={isFetching}
          onClick={retry}
          className="w-full bg-bg-black p-4 text-center text-body-14rg text-text-inverse/50"
        >
          {retryAction === 'fetchNext' ? COMMENT_FETCH_NEXT_ERROR_TEXT : COMMENT_REFETCH_ERROR_TEXT}
        </button>
      ) : (
        canLoadMore && (
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={loadMore}
            className="flex w-full items-center justify-center gap-2 bg-bg-black p-4 text-body-16md text-text-inverse"
          >
            {COMMENT_MORE_TEXT}
            <PlusIcon width={20} height={20} className="text-icon-active" />
          </button>
        )
      )}
    </section>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

import { Button } from '@/app/_global/_components/Button/Button'
import { policyQueries } from '@/app/_global/_queries/policy.queries'
import type { PolicyMeta } from '@/app/_shared/terms/_data/policy.constant'

type PolicyDetailContentProps = {
  policy: PolicyMeta
}

export function PolicyDetailContent({ policy }: PolicyDetailContentProps) {
  const router = useRouter()
  const policyQuery = useQuery(policyQueries.detail(policy.apiType))
  const content = policyQuery.data?.data?.content ?? ''

  return (
    <main className="flex h-full min-h-0 flex-col bg-bg-default">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 text-body-14rg text-text-secondary">
        <ReactMarkdown
          components={{
            h1: ({ ...props }) => (
              <h1 className="mb-4 text-title-20bd text-text-primary" {...props} />
            ),
            h2: ({ ...props }) => (
              <h2 className="mt-6 mb-3 text-title-18bd text-text-primary" {...props} />
            ),
            h3: ({ ...props }) => (
              <h3 className="mt-5 mb-2 text-body-16bd text-text-primary" {...props} />
            ),
            p: ({ ...props }) => <p className="my-2 leading-6" {...props} />,
            ul: ({ ...props }) => <ul className="my-2 list-disc pl-5 leading-6" {...props} />,
            ol: ({ ...props }) => <ol className="my-2 list-decimal pl-5 leading-6" {...props} />,
            li: ({ ...props }) => <li className="my-1" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      <div className="shrink-0 bg-bg-default p-4">
        <Button
          className="h-[54px] w-full bg-interactive-btn-secondary"
          onClick={() => {
            router.back()
          }}
        >
          닫기
        </Button>
      </div>
    </main>
  )
}

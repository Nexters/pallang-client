import { queryOptions } from '@tanstack/react-query'

import { getPolicy } from '../_apis/_generated/policy/policy'

type PolicyType = Parameters<typeof getPolicy>[0]

export const policyQueries = {
  all: () => ['policy'] as const,
  detail: (type: PolicyType) =>
    queryOptions({
      queryKey: [...policyQueries.all(), type],
      queryFn: () => getPolicy(type),
    }),
}

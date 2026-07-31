export type PolicySlug = 'privacy' | 'service'
export type PolicyType = 'PRIVACY' | 'TERMS'

export type PolicyMeta = {
  apiType: PolicyType
  path: string
}

export const POLICY_META_BY_SLUG = {
  privacy: {
    apiType: 'PRIVACY',
    path: '/terms/privacy',
  },
  service: {
    apiType: 'TERMS',
    path: '/terms/service',
  },
} satisfies Record<PolicySlug, PolicyMeta>

export function isPolicySlug(value: string): value is PolicySlug {
  return value in POLICY_META_BY_SLUG
}

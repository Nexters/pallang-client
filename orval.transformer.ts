import { defineTransformer } from 'orval'

// 한글+괄호 태그가 그대로 파일명이 되는 것을 방지한다.
const TAG_RENAMES: Record<string, string> = {
  '대목(Passage)': 'Passage',
}

const renameTag = (tag: string) => TAG_RENAMES[tag] ?? tag

// openapi-types의 3.1 Document는 index signature 기반이라 필요한 부분만 좁혀서 다룬다.
type SpecSubset = {
  tags?: { name: string }[]
  paths?: Record<string, Record<string, { tags?: string[] } | undefined> | undefined>
  components?: { securitySchemes?: Record<string, { type?: string; name?: string }> }
}

export default defineTransformer((spec) => {
  const raw = spec as unknown as SpecSubset
  raw.tags?.forEach((tag) => {
    tag.name = renameTag(tag.name)
  })
  // 서버 스펙 버그 우회: http 타입 securityScheme에는 name 속성이 허용되지 않는다.
  Object.values(raw.components?.securitySchemes ?? {}).forEach((scheme) => {
    if (scheme.type === 'http') delete scheme.name
  })
  Object.values(raw.paths ?? {}).forEach((methods) => {
    Object.values(methods ?? {}).forEach((operation) => {
      if (operation && typeof operation === 'object' && Array.isArray(operation.tags)) {
        operation.tags = operation.tags.map(renameTag)
      }
    })
  })
  return spec
})

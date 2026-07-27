import { defineConfig } from 'orval'

export default defineConfig({
  pallang: {
    input: {
      target: 'https://api-dev.pallang.co.kr/v3/api-docs',
      override: {
        transformer: './orval.transformer.ts',
      },
    },
    output: {
      mode: 'tags-split',
      client: 'fetch',
      target: 'app/_global/_apis/_generated',
      schemas: 'app/_global/_apis/_generated/models',
      formatter: 'prettier',
      override: {
        mutator: {
          path: 'app/_global/_apis/customFetch.api.ts',
          name: 'customFetch',
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
})

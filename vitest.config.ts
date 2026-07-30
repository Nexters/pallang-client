import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.spec.{ts,tsx}'],
    // 에이전트 도구가 .claude/worktrees에 만드는 저장소 사본까지 훑으면
    // 다른 브랜치의 테스트가 현재 브랜치 결과에 섞인다.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})

import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tseslint from 'typescript-eslint'
import checkFile from 'eslint-plugin-check-file'
import noBarrelFiles from 'eslint-plugin-no-barrel-files'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import boundaries from 'eslint-plugin-boundaries'
import vitest from '@vitest/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier'
import storybook from 'eslint-plugin-storybook'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // 타입 인지 strict 린트 (ts/tsx 한정)
  ...tseslint.configs.strictTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  ...tseslint.configs.stylisticTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 설정/JS 파일은 타입 인지 룰 비활성
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },

  // 배럴 파일 금지
  ...noBarrelFiles.configs.recommended,

  // 컨벤션 룰 + import 위생
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'check-file': checkFile,
      'simple-import-sort': simpleImportSort,
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      'import/no-default-export': 'error',
      // 안전장치: console.log 금지(warn/error만), effect 의존성 배열 강제
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react-hooks/exhaustive-deps': 'error',
      // import 위생
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/no-duplicates': 'error',
      'import/no-cycle': 'error',
      'import/no-useless-path-segments': 'error',
      // 타입 전용 import는 `import type`로 (기존 스타일 유지)
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      // 스파르타 컨벤션: 객체 타입은 `type` 별칭 사용
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // 컴포넌트 파일 PascalCase, 그 외 프라이빗 폴더의 ts는 camelCase.
      // (접미사 `.service`/`.queries` 등은 ignoreMiddleExtensions로 base명만 검사)
      'check-file/filename-naming-convention': [
        'error',
        {
          'app/**/_components/**/*.tsx': 'PASCAL_CASE',
          'app/**/_hooks/**/*.ts': 'CAMEL_CASE',
          'app/**/_services/**/*.ts': 'CAMEL_CASE',
          'app/**/_data/**/*.ts': 'CAMEL_CASE',
          'app/**/_actions/**/*.ts': 'CAMEL_CASE',
          'app/**/_types/**/*.ts': 'CAMEL_CASE',
          'app/**/_queries/**/*.ts': 'CAMEL_CASE',
          'app/**/_apis/**/*.ts': 'CAMEL_CASE',
        },
        { ignoreMiddleExtensions: true },
      ],
    },
  },

  // 서버 상태: 피처 코드에서 _apis 직접 import 금지 (_queries 경유)
  {
    files: ['app/**/*.{ts,tsx}'],
    ignores: ['app/_global/_queries/**', 'app/_global/_apis/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/_apis/*', '@/app/_global/_apis/*'],
              message:
                'API 함수는 직접 import하지 말고 @/app/_global/_queries의 queryOptions를 사용하세요.',
            },
          ],
        },
      ],
    },
  },

  // 아키텍처 경계: global / shared / feature 레이어 강제 (eslint-plugin-boundaries v7)
  // 허용: feature→(global·shared·자기 자신), shared→(global·shared), global→global.
  // 루트 app/layout·page 등은 미분류라 제약 없음(Next 특수 파일).
  {
    files: ['app/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'global', pattern: 'app/_global' },
        { type: 'shared', pattern: 'app/_shared/*', capture: ['domain'] },
        { type: 'feature', pattern: 'app/*', capture: ['feature'] },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'global' } },
              allow: [{ to: { element: { type: 'global' } } }],
            },
            {
              from: { element: { type: 'shared' } },
              allow: [
                { to: { element: { type: 'global' } } },
                { to: { element: { type: 'shared' } } },
              ],
            },
            {
              from: { element: { type: 'feature' } },
              allow: [
                { to: { element: { type: 'global' } } },
                { to: { element: { type: 'shared' } } },
                {
                  to: {
                    element: {
                      type: 'feature',
                      captured: { feature: '{{ from.element.captured.feature }}' },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // 테스트 파일: Vitest 권장 룰(.only 커밋 차단 등)
  {
    files: ['**/*.spec.{ts,tsx}'],
    ...vitest.configs.recommended,
  },

  // Next 특수 파일 / 설정 파일은 default export 허용
  {
    files: [
      'app/**/{page,layout,template,default,error,global-error,loading,not-found,route,sitemap,robots,manifest,opengraph-image,twitter-image,icon,apple-icon}.{ts,tsx}',
      '**/middleware.ts',
      '**/instrumentation.ts',
      '**/*.config.{js,mjs,ts}',
      '**/*.d.ts',
      // Storybook: CSF meta와 .storybook 설정은 default export가 필수
      '**/*.stories.{ts,tsx}',
      '.storybook/**/*.{ts,tsx}',
    ],
    rules: { 'import/no-default-export': 'off' },
  },

  // Storybook 스토리 파일 권장 룰
  ...storybook.configs['flat/recommended'],

  // Prettier와 충돌하는 스타일 룰 비활성 (항상 마지막)
  eslintConfigPrettier,

  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'storybook-static/**',
    'ios/**',
    'android/**',
  ]),
])

export default eslintConfig

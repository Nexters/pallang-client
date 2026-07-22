import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import tseslint from 'typescript-eslint'
import checkFile from 'eslint-plugin-check-file'
import noBarrelFiles from 'eslint-plugin-no-barrel-files'
import importPlugin from 'eslint-plugin-import'
import eslintConfigPrettier from 'eslint-config-prettier'

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

  // 컨벤션 룰
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile, import: importPlugin },
    rules: {
      'import/no-default-export': 'error',
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
      'check-file/folder-naming-convention': [
        'error',
        { 'app/**/_components/*/': 'PASCAL_CASE' },
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

  // Next 특수 파일 / 설정 파일은 default export 허용
  {
    files: [
      'app/**/{page,layout,template,default,error,global-error,loading,not-found,route,sitemap,robots,manifest,opengraph-image,twitter-image,icon,apple-icon}.{ts,tsx}',
      '**/middleware.ts',
      '**/instrumentation.ts',
      '**/*.config.{js,mjs,ts}',
      'next-env.d.ts',
    ],
    rules: { 'import/no-default-export': 'off' },
  },

  // Prettier와 충돌하는 스타일 룰 비활성 (항상 마지막)
  eslintConfigPrettier,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
])

export default eslintConfig

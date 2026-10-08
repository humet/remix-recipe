import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow the `{ omitted: _, ...rest }` idiom used to drop keys.
      '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
    },
  },
  globalIgnores([
    '.next/**',
    'node_modules/**',
    '.claude/worktrees/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

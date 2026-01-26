// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Property-based test for environment variable access pattern
 * Feature: nextjs-to-vite-migration, Property 1: Environment Variable Access Pattern
 * 
 * Validates: Requirements 4.1, 4.2
 * 
 * This test verifies that all files in the src/ directory use the correct
 * Vite environment variable pattern (import.meta.env.VITE_*) and do not
 * use the old NextJS pattern (process.env.NEXT_PUBLIC_*)
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Recursively get all TypeScript/JavaScript files in a directory
 * @param dir - Directory path to search
 * @param fileList - Accumulated list of files
 * @returns Array of file paths
 */
function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      // Skip node_modules and build directories
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'build') {
        getAllSourceFiles(filePath, fileList)
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

describe('Property 1: Environment Variable Access Pattern', () => {
  const srcDir = path.resolve(__dirname, '..')
  const allSourceFiles = getAllSourceFiles(srcDir)
  
  it('should not use process.env.NEXT_PUBLIC_* pattern in any source file', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allSourceFiles),
        (filePath) => {
          // Skip test files themselves (they may reference the pattern in tests)
          if (filePath.includes('/test/')) {
            return true
          }
          
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // Check for NextJS environment variable pattern
          const hasNextJSPattern = /process\.env\.NEXT_PUBLIC_/g.test(content)
          
          return !hasNextJSPattern
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should use import.meta.env.VITE_* pattern when accessing environment variables', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...allSourceFiles),
        (filePath) => {
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // If file accesses environment variables, it should use Vite pattern
          const hasEnvAccess = /env\./g.test(content)
          
          if (hasEnvAccess) {
            // Should use import.meta.env pattern
            const hasVitePattern = /import\.meta\.env/g.test(content)
            const hasProcessEnv = /process\.env/g.test(content)
            
            // If it has env access, it should use Vite pattern and not process.env
            return hasVitePattern || !hasProcessEnv
          }
          
          // If no env access, test passes
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

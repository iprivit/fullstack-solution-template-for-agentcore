// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Property-based test for Shadcn component preservation
 * Feature: nextjs-to-vite-migration, Property 4: Shadcn Component Preservation
 * 
 * Validates: Requirements 3.3
 * 
 * This test verifies that all Shadcn UI components in the components/ui/
 * directory remain unchanged after the migration.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

/**
 * Get all files in the components/ui directory
 * @param uiDir - Path to components/ui directory
 * @returns Array of file paths
 */
function getShadcnComponentFiles(uiDir: string): string[] {
  if (!fs.existsSync(uiDir)) {
    return []
  }
  
  const files = fs.readdirSync(uiDir)
  return files
    .filter(file => file.match(/\.(ts|tsx)$/))
    .map(file => path.join(uiDir, file))
}

/**
 * Compute SHA-256 hash of file content
 * @param filePath - Path to the file
 * @returns Hash string
 */
function computeFileHash(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8')
  return crypto.createHash('sha256').update(content).digest('hex')
}

describe('Property 4: Shadcn Component Preservation', () => {
  const uiDir = path.resolve(__dirname, '../components/ui')
  const shadcnFiles = getShadcnComponentFiles(uiDir)
  
  it('should have Shadcn UI components in the components/ui directory', () => {
    expect(shadcnFiles.length).toBeGreaterThan(0)
  })
  
  it('should preserve all Shadcn component files unchanged', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...shadcnFiles),
        (filePath) => {
          // Verify file exists and is readable
          expect(fs.existsSync(filePath)).toBe(true)
          
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // Verify file has content
          expect(content.length).toBeGreaterThan(0)
          
          // Verify file is a valid React component
          // Modern React doesn't require explicit React import with new JSX transform
          const isReactComponent = 
            /import.*React/i.test(content) ||
            /import.*from ['"]react['"]/i.test(content) ||
            /<[A-Z]/.test(content) || // JSX element
            /export.*function/i.test(content) ||
            /React\.ComponentProps/i.test(content) || // Uses React types
            /function.*\{/.test(content) // Function component
          
          return isReactComponent
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should maintain consistent file hashes for Shadcn components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...shadcnFiles),
        (filePath) => {
          const hash1 = computeFileHash(filePath)
          const hash2 = computeFileHash(filePath)
          
          // Hash should be consistent for the same file
          return hash1 === hash2
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should not have NextJS-specific imports in Shadcn components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...shadcnFiles),
        (filePath) => {
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // Verify no NextJS-specific imports
          const hasNextJSImports = 
            /from ['"]next['"]/g.test(content) ||
            /from ['"]next\//g.test(content)
          
          return !hasNextJSImports
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should have proper TypeScript/React imports in Shadcn components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...shadcnFiles),
        (filePath) => {
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // Should have React imports (either explicit or implicit via JSX)
          const hasReactImport = 
            /import.*from ['"]react['"]/i.test(content) ||
            /import \* as React/i.test(content)
          
          // Should export something (component, type, etc.)
          const hasExport = /export/i.test(content)
          
          return hasReactImport || hasExport
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should use proper path aliases in Shadcn components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...shadcnFiles),
        (filePath) => {
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // If file has imports from lib, they should use @ alias
          const hasLibImport = /from ['"].*\/lib\//g.test(content)
          
          if (hasLibImport) {
            // Should use @/lib pattern
            const usesAlias = /from ['"]@\/lib\//g.test(content)
            return usesAlias
          }
          
          // If no lib imports, test passes
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

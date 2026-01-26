// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Property-based test for UI library dependency preservation
 * Feature: nextjs-to-vite-migration, Property 6: UI Library Dependency Preservation
 * 
 * Validates: Requirements 9.4
 * 
 * This test verifies that all UI library dependencies from the original
 * package.json are preserved in the migrated version.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Parse package.json and extract dependencies
 * @param packageJsonPath - Path to package.json
 * @returns Object with dependencies and devDependencies
 */
function parsePackageJson(packageJsonPath: string): {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
} {
  const content = fs.readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(content)
  
  return {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {}
  }
}

/**
 * Get all UI library dependencies
 * @param deps - Dependencies object
 * @returns Array of UI library names
 */
function getUILibraries(deps: Record<string, string>): string[] {
  const uiLibraryPatterns = [
    '@radix-ui/',
    'lucide-react',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
    'react-dropzone',
    'react-spinners',
    '@shadcn/ui',
    'shadcn',
    'radix-ui'
  ]
  
  return Object.keys(deps).filter(dep => 
    uiLibraryPatterns.some(pattern => dep.includes(pattern))
  )
}

describe('Property 6: UI Library Dependency Preservation', () => {
  const packageJsonPath = path.resolve(__dirname, '../../package.json')
  const packageData = parsePackageJson(packageJsonPath)
  
  const allDeps = {
    ...packageData.dependencies,
    ...packageData.devDependencies
  }
  
  const uiLibraries = getUILibraries(allDeps)
  
  it('should have UI libraries in package.json', () => {
    expect(uiLibraries.length).toBeGreaterThan(0)
  })
  
  it('should preserve all UI library dependencies', () => {
    // Essential UI libraries that must be present
    const essentialUILibs = [
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-slot',
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom(...essentialUILibs),
        (libName) => {
          return libName in allDeps
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should have valid version strings for UI libraries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...uiLibraries),
        (libName) => {
          const version = allDeps[libName]
          
          // Version should be a non-empty string
          expect(version).toBeDefined()
          expect(typeof version).toBe('string')
          expect(version.length).toBeGreaterThan(0)
          
          // Version should match semver pattern (with ^ or ~ prefix)
          const isValidVersion = /^[\^~]?\d+\.\d+\.\d+/.test(version)
          
          return isValidVersion
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should not have NextJS dependencies', () => {
    const nextJSDeps = ['next', 'eslint-config-next']
    
    fc.assert(
      fc.property(
        fc.constantFrom(...nextJSDeps),
        (depName) => {
          return !(depName in allDeps)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should have Vite dependencies', () => {
    const viteDeps = ['vite', '@vitejs/plugin-react']
    
    fc.assert(
      fc.property(
        fc.constantFrom(...viteDeps),
        (depName) => {
          return depName in allDeps
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should have react-router-dom for routing', () => {
    fc.assert(
      fc.property(
        fc.constant('react-router-dom'),
        (depName) => {
          return depName in allDeps
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should maintain Radix UI component dependencies', () => {
    const radixComponents = Object.keys(allDeps).filter(dep => 
      dep.startsWith('@radix-ui/react-')
    )
    
    // Should have multiple Radix UI components
    expect(radixComponents.length).toBeGreaterThan(0)
    
    fc.assert(
      fc.property(
        fc.constantFrom(...radixComponents),
        (componentName): boolean => {
          // Each Radix component should have a valid version
          const version = allDeps[componentName]
          return !!(version && version.length > 0)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should preserve Tailwind CSS and related dependencies', () => {
    const tailwindDeps = ['tailwindcss', '@tailwindcss/postcss', 'tailwind-merge']
    
    fc.assert(
      fc.property(
        fc.constantFrom(...tailwindDeps),
        (depName) => {
          return depName in allDeps
        }
      ),
      { numRuns: 100 }
    )
  })
})

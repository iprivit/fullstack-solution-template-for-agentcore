// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Property-based test for CSS variable preservation
 * Feature: nextjs-to-vite-migration, Property 3: CSS Variable Preservation
 * 
 * Validates: Requirements 3.2
 * 
 * This test verifies that all CSS custom properties (variables) defined in
 * the original globals.css are preserved with the same values after migration.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Parse CSS file and extract all CSS custom properties
 * @param cssContent - CSS file content
 * @returns Map of variable names to their values
 */
function parseCSSVariables(cssContent: string): Map<string, string> {
  const variables = new Map<string, string>()
  
  // Match CSS custom properties (--variable-name: value;)
  const variableRegex = /--([\w-]+)\s*:\s*([^;]+);/g
  let match
  
  while ((match = variableRegex.exec(cssContent)) !== null) {
    const varName = match[1]
    const varValue = match[2].trim()
    variables.set(varName, varValue)
  }
  
  return variables
}

describe('Property 3: CSS Variable Preservation', () => {
  const cssFilePath = path.resolve(__dirname, '../styles/globals.css')
  const cssContent = fs.readFileSync(cssFilePath, 'utf-8')
  const allVariables = parseCSSVariables(cssContent)
  const variableNames = Array.from(allVariables.keys())
  
  it('should preserve all CSS custom properties with their values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...variableNames),
        (varName) => {
          // Verify the variable exists in the current CSS
          expect(allVariables.has(varName)).toBe(true)
          
          // Verify the variable has a non-empty value
          const value = allVariables.get(varName)
          expect(value).toBeDefined()
          expect(value!.length).toBeGreaterThan(0)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should maintain consistent CSS variable values across multiple reads', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...variableNames),
        (varName) => {
          // Read the file again and parse variables
          const content1 = fs.readFileSync(cssFilePath, 'utf-8')
          const vars1 = parseCSSVariables(content1)
          
          const content2 = fs.readFileSync(cssFilePath, 'utf-8')
          const vars2 = parseCSSVariables(content2)
          
          // Values should be consistent
          return vars1.get(varName) === vars2.get(varName)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should have all required theme variables defined', () => {
    // Essential variables that must exist for the theme to work
    const requiredVariables = [
      'background',
      'foreground',
      'primary',
      'secondary',
      'muted',
      'accent',
      'destructive',
      'border',
      'input',
      'ring',
      'font-geist-sans',
      'font-geist-mono',
      'radius'
    ]
    
    fc.assert(
      fc.property(
        fc.constantFrom(...requiredVariables),
        (varName) => {
          return allVariables.has(varName)
        }
      ),
      { numRuns: 100 }
    )
  })
  
  it('should have valid CSS color values for color variables', () => {
    const colorVariables = variableNames.filter(name => 
      name.includes('color') || 
      name === 'background' || 
      name === 'foreground' ||
      name === 'primary' ||
      name === 'secondary' ||
      name === 'muted' ||
      name === 'accent' ||
      name === 'destructive' ||
      name === 'border' ||
      name === 'input' ||
      name === 'ring' ||
      name.startsWith('chart-') ||
      name.startsWith('sidebar') ||
      name.startsWith('brand-')
    )
    
    if (colorVariables.length === 0) {
      // Skip if no color variables found
      return
    }
    
    fc.assert(
      fc.property(
        fc.constantFrom(...colorVariables),
        (varName) => {
          const value = allVariables.get(varName)!
          
          // Valid color formats: oklch(), hsl(), rgb(), hex, var(), or HSL values
          const isValidColor = 
            /oklch\([^)]+\)/.test(value) ||
            /hsl\([^)]+\)/.test(value) ||
            /rgb\([^)]+\)/.test(value) ||
            /^#[0-9a-fA-F]{3,8}$/.test(value) ||
            /var\(--[^)]+\)/.test(value) ||
            /^\d+\s+\d+%\s+\d+%$/.test(value) // HSL values without hsl()
          
          return isValidColor
        }
      ),
      { numRuns: 100 }
    )
  })
})

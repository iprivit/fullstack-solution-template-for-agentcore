// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Routing tests for NextJS to Vite migration
 * Tests that react-router-dom is configured correctly
 * 
 * Requirements: 2.1, 2.2
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Routing Tests', () => {
  describe('Route Configuration', () => {
    it('should use react-router-dom Routes component', () => {
      const routesContent = readFileSync(resolve(__dirname, '../routes/index.tsx'), 'utf-8')
      expect(routesContent).toContain('import { Routes, Route } from \'react-router-dom\'')
      expect(routesContent).toContain('<Routes>')
      expect(routesContent).toContain('</Routes>')
    })

    it('should define root route "/" pointing to ChatPage', () => {
      const routesContent = readFileSync(resolve(__dirname, '../routes/index.tsx'), 'utf-8')
      expect(routesContent).toContain('<Route path="/" element={<ChatPage />} />')
    })

    it('should import ChatPage component', () => {
      const routesContent = readFileSync(resolve(__dirname, '../routes/index.tsx'), 'utf-8')
      expect(routesContent).toContain('import ChatPage from \'./ChatPage\'')
    })

    it('should export AppRoutes as default', () => {
      const routesContent = readFileSync(resolve(__dirname, '../routes/index.tsx'), 'utf-8')
      expect(routesContent).toContain('export default function AppRoutes()')
    })
  })

  describe('BrowserRouter Configuration', () => {
    it('should use BrowserRouter in App component', () => {
      const appContent = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
      expect(appContent).toContain('import { BrowserRouter } from \'react-router-dom\'')
      expect(appContent).toContain('<BrowserRouter>')
      expect(appContent).toContain('</BrowserRouter>')
    })

    it('should wrap entire app with BrowserRouter', () => {
      const appContent = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
      
      // BrowserRouter should be the outermost component
      const browserRouterIndex = appContent.indexOf('<BrowserRouter>')
      const authProviderIndex = appContent.indexOf('<AuthProvider>')
      
      expect(browserRouterIndex).toBeGreaterThan(0)
      expect(authProviderIndex).toBeGreaterThan(browserRouterIndex)
    })

    it('should render AppRoutes inside BrowserRouter', () => {
      const appContent = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
      expect(appContent).toContain('import AppRoutes from \'./routes\'')
      expect(appContent).toContain('<AppRoutes />')
    })
  })

  describe('Route Structure', () => {
    it('should have routes directory with index.tsx', () => {
      const routesContent = readFileSync(resolve(__dirname, '../routes/index.tsx'), 'utf-8')
      expect(routesContent).toBeTruthy()
    })

    it('should have ChatPage in routes directory', () => {
      const chatPageContent = readFileSync(resolve(__dirname, '../routes/ChatPage.tsx'), 'utf-8')
      expect(chatPageContent).toBeTruthy()
      expect(chatPageContent).toContain('export default function ChatPage()')
    })
  })

  describe('Routing vs NextJS', () => {
    it('should NOT use NextJS file-based routing', () => {
      const appContent = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
      
      // Should not import from 'next/router' or 'next/navigation'
      expect(appContent).not.toContain('next/router')
      expect(appContent).not.toContain('next/navigation')
    })

    it('should use explicit route definitions', () => {
      const routesContent = readFileSync(resolve(__dirname, '../routes/index.tsx'), 'utf-8')
      
      // Should have explicit Route components
      expect(routesContent).toContain('<Route')
      expect(routesContent).toContain('path=')
      expect(routesContent).toContain('element=')
    })

    it('should NOT have app directory routing structure', () => {
      const appContent = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
      
      // Should not reference app directory for routing
      expect(appContent).not.toContain('app/page')
      expect(appContent).not.toContain('app/layout')
    })
  })

  describe('Client-Side Routing', () => {
    it('should use client-side routing with BrowserRouter', () => {
      const appContent = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
      
      // BrowserRouter is for client-side routing
      expect(appContent).toContain('BrowserRouter')
      
      // Should NOT use server-side routing components
      expect(appContent).not.toContain('StaticRouter')
      expect(appContent).not.toContain('MemoryRouter')
    })

    it('should support single-page application routing', () => {
      const routesContent = readFileSync(resolve(__dirname, '../routes/index.tsx'), 'utf-8')
      
      // Should use Routes component for SPA routing
      expect(routesContent).toContain('Routes')
      expect(routesContent).toContain('Route')
    })
  })

  describe('Route Component Integration', () => {
    it('should integrate routes with authentication', () => {
      const appContent = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
      
      // Routes should be wrapped with AuthProvider
      const authProviderIndex = appContent.indexOf('<AuthProvider>')
      const appRoutesIndex = appContent.indexOf('<AppRoutes />')
      
      expect(authProviderIndex).toBeGreaterThan(0)
      expect(appRoutesIndex).toBeGreaterThan(authProviderIndex)
    })

    it('should have proper component hierarchy', () => {
      const appContent = readFileSync(resolve(__dirname, '../App.tsx'), 'utf-8')
      
      // Hierarchy: BrowserRouter > AuthProvider > AppRoutes
      const browserRouterIndex = appContent.indexOf('<BrowserRouter>')
      const authProviderIndex = appContent.indexOf('<AuthProvider>')
      const appRoutesIndex = appContent.indexOf('<AppRoutes />')
      
      expect(browserRouterIndex).toBeLessThan(authProviderIndex)
      expect(authProviderIndex).toBeLessThan(appRoutesIndex)
    })
  })
})

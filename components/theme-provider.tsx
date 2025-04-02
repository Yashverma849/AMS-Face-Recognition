'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  // Ensure we only render theme switching in the client to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // If not mounted yet, render children without theme context
  // This prevents hydration mismatch
  if (!mounted) {
    return <>{children}</>
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

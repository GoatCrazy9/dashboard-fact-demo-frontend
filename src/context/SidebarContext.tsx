/* oxlint-disable react/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface SidebarContextValue {
  isExpanded: boolean
  isMobileOpen: boolean
  isHovered: boolean
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  closeMobileSidebar: () => void
  setIsHovered: (hovered: boolean) => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // El menú lateral no debe quedar abierto al pasar a escritorio.
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1280) setIsMobileOpen(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const value = {
    isExpanded,
    isMobileOpen,
    isHovered,
    toggleSidebar: () => setIsExpanded((open) => !open),
    toggleMobileSidebar: () => setIsMobileOpen((open) => !open),
    closeMobileSidebar: () => setIsMobileOpen(false),
    setIsHovered,
  }

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar debe usarse dentro de <SidebarProvider>')
  return context
}
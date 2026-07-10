/**
 * App.jsx — Application Root
 *
 * Wraps the entire application in the required context providers
 * (ProfileProvider → IssueProvider → AppShell) so that all descendant
 * components can access profile state and the issue queue.
 *
 * Provider order matters: ProfileProvider is outermost because
 * IssueProvider and AppShell both consume profile state.
 */

import { useState, useEffect } from 'react'
import { ProfileProvider } from './context/ProfileContext.jsx'
import { IssueProvider } from './context/IssueContext.jsx'
import AppShell from './components/layout/AppShell.jsx'
import MobileApp from './MobileApp.jsx'

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <ProfileProvider>
      <IssueProvider>
        {isMobile ? <MobileApp /> : <AppShell />}
      </IssueProvider>
    </ProfileProvider>
  )
}

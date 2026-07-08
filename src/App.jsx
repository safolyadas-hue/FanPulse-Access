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

import { ProfileProvider } from './context/ProfileContext.jsx'
import { IssueProvider } from './context/IssueContext.jsx'
import AppShell from './components/layout/AppShell.jsx'

export default function App() {
  return (
    <ProfileProvider>
      <IssueProvider>
        <AppShell />
      </IssueProvider>
    </ProfileProvider>
  )
}

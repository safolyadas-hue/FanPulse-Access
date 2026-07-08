/**
 * useIssues.js — Issue Queue Hook
 *
 * Thin wrapper around IssueContext that provides a clean API and
 * enforces the provider boundary.
 *
 * Usage:
 *   const { issues, addIssue, updateIssue, clearIssues, openCount } = useIssues()
 */

import { useContext, useMemo } from 'react'
import { IssueContext } from '../context/IssueContext.jsx'

/**
 * @returns {{
 *   issues:       Object[],
 *   addIssue:     (data: Object) => Object,
 *   updateIssue:  (id: string, updates: Object) => void,
 *   clearIssues:  () => void,
 *   openCount:    number,
 *   issuesByZone: Object,
 *   issuesByCategory: Object,
 * }}
 */
export function useIssues() {
  const context = useContext(IssueContext)

  if (!context) {
    throw new Error(
      'useIssues() must be used within an <IssueProvider>. ' +
      'Wrap your app root with <IssueProvider> in App.jsx.'
    )
  }

  const { issues, addIssue, updateIssue, clearIssues } = context

  /**
   * Derived statistics, memoized to avoid recomputation on every render.
   */
  const derived = useMemo(() => {
    const openCount = issues.filter((i) => i.status === 'open').length

    // Group issues by zone
    const issuesByZone = issues.reduce((acc, issue) => {
      const zone = issue.zone || 'unknown'
      if (!acc[zone]) acc[zone] = []
      acc[zone].push(issue)
      return acc
    }, {})

    // Group issues by category
    const issuesByCategory = issues.reduce((acc, issue) => {
      const cat = issue.category || 'other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(issue)
      return acc
    }, {})

    return { openCount, issuesByZone, issuesByCategory }
  }, [issues])

  return {
    issues,
    addIssue,
    updateIssue,
    clearIssues,
    ...derived,
  }
}

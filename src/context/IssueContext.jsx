/**
 * IssueContext.jsx — Issue Queue State Provider
 *
 * Shared in-memory queue that connects fan-side issue reporting with the
 * staff dashboard. When a fan reports a problem (broken elevator, spill,
 * etc.), the report is added here with a timestamp and appears in real-time
 * on Aditi's staff dashboard.
 *
 * Persistence: Issues are stored in localStorage so they survive page
 * reloads during a session, but this is NOT a backend — it is purely
 * client-side state for demonstration purposes.
 *
 * Provides:
 *   - issues:       Object[]  – Array of issue objects.
 *   - addIssue:     function  – Add a new issue to the queue.
 *   - updateIssue:  function  – Update an existing issue (status changes).
 *   - clearIssues:  function  – Clear the queue (staff action).
 */

import { createContext, useState, useCallback, useMemo } from 'react'
import { ISSUE_STATUS } from '../constants/issueStatus.js'

const STORAGE_KEY = 'fanpulse_issue_queue'

/**
 * Issue object shape:
 * @typedef {Object} Issue
 * @property {string} id          – Unique identifier (UUID-like).
 * @property {string} category    – Issue type: 'elevator', 'ramp', 'restroom', 'spill', 'safety', 'noise', 'other'.
 * @property {string} zone        – Stadium zone: 'east', 'south', 'west', 'north'.
 * @property {string} level       – Stadium level: 'lower', 'mezzanine', 'upper'.
 * @property {string} description – Fan's description of the issue (sanitized).
 * @property {string} location    – Specific location text.
 * @property {string} status      – 'open' | 'in_progress' | 'resolved'.
 * @property {string} priority    – 'low' | 'medium' | 'high' | 'critical' (may be AI-assigned).
 * @property {string} reportedAt  – ISO 8601 timestamp.
 * @property {string} [resolvedAt] – ISO 8601 timestamp, set when resolved.
 */

/**
 * Load persisted issues from localStorage.
 *
 * @returns {Issue[]}
 */
function loadIssues() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // Corrupted data or unavailable storage
  }
  
  // Seed initial mock tickets if empty
  return [
    {
      id: `issue-${Date.now()}-1`,
      category: 'elevator',
      zone: 'east',
      level: 'lower',
      description: 'Elevator 2 Out of Service',
      location: 'Gate A',
      status: ISSUE_STATUS.OPEN,
      priority: 'high',
      reportedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: `issue-${Date.now()}-2`,
      category: 'spill',
      zone: 'south',
      level: 'lower',
      description: 'Spill near Gate C',
      location: 'Gate C Concourse',
      status: ISSUE_STATUS.IN_PROGRESS,
      priority: 'medium',
      reportedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    }
  ]
}

/**
 * Persist issues to localStorage.
 *
 * @param {Issue[]} issues
 */
function saveIssues(issues) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues))
  } catch {
    // Silently ignore storage failures
  }
}

/**
 * Generate a simple unique ID (not cryptographically secure, but sufficient
 * for a client-side demo queue).
 *
 * @returns {string}
 */
function generateId() {
  return `issue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** @type {React.Context} */
export const IssueContext = createContext(null)

/**
 * Provider component. Wrap the app root with this alongside ProfileProvider.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function IssueProvider({ children }) {
  const [issues, setIssues] = useState(loadIssues)

  /**
   * Add a new issue to the queue.
   *
   * @param {Omit<Issue, 'id' | 'reportedAt' | 'status'>} issueData
   *   – Partial issue object (category, zone, level, description, location).
   * @returns {Issue} The complete issue object that was added.
   */
  const addIssue = useCallback((issueData) => {
    const newIssue = {
      id: generateId(),
      category: issueData.category || 'other',
      zone: issueData.zone || 'unknown',
      level: issueData.level || 'lower',
      description: issueData.description || '',
      location: issueData.location || '',
      status: ISSUE_STATUS.OPEN,
      priority: issueData.priority || 'medium',
      reportedAt: new Date().toISOString(),
    }

    setIssues((prev) => {
      const updated = [newIssue, ...prev]
      saveIssues(updated)
      return updated
    })

    return newIssue
  }, [])

  /**
   * Update an existing issue (e.g., change status to 'in_progress' or 'resolved').
   *
   * @param {string} issueId – ID of the issue to update.
   * @param {Partial<Issue>} updates – Fields to merge into the issue.
   */
  const updateIssue = useCallback((issueId, updates) => {
    setIssues((prev) => {
      const updated = prev.map((issue) => {
        if (issue.id !== issueId) return issue
        const merged = { ...issue, ...updates }
        // Auto-set resolvedAt when status changes to 'resolved'
        if (updates.status === ISSUE_STATUS.RESOLVED && !issue.resolvedAt) {
          merged.resolvedAt = new Date().toISOString()
        }
        return merged
      })
      saveIssues(updated)
      return updated
    })
  }, [])

  /**
   * Clear all issues from the queue (staff reset action).
   */
  const clearIssues = useCallback(() => {
    setIssues([])
    saveIssues([])
  }, [])

  const value = useMemo(
    () => ({ issues, addIssue, updateIssue, clearIssues }),
    [issues, addIssue, updateIssue, clearIssues]
  )

  return (
    <IssueContext.Provider value={value}>
      {children}
    </IssueContext.Provider>
  )
}

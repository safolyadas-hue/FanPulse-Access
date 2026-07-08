import { useIssues } from './useIssues.js'

/**
 * useTickets.js — Global mock state manager for tickets.
 * Wraps useIssues to provide the exact API needed for the Fan & Staff Views.
 */
export function useTickets() {
  const { issues, addIssue, updateIssue } = useIssues()

  const submitTicket = (location, type, description) => {
    return addIssue({ location, category: type, description })
  }

  const updateTicketStatus = (id, status) => {
    updateIssue(id, { status })
  }

  return {
    tickets: issues,
    submitTicket,
    updateTicketStatus,
  }
}

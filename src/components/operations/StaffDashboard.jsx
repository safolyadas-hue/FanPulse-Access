import { useState } from 'react'
import { useTickets } from '../../hooks/useTickets.js'

function getStatusColor(status) {
  switch (status) {
    case 'open': return 'bg-error-container text-error'
    case 'in_progress': return 'bg-warning-container text-warning'
    case 'resolved': return 'bg-primary-container text-primary'
    default: return 'bg-surface-container text-on-surface'
  }
}

function getPriorityColor(priority) {
  switch (priority) {
    case 'critical':
    case 'high': return 'text-error'
    case 'medium': return 'text-warning'
    case 'low': return 'text-primary'
    default: return 'text-on-surface-variant'
  }
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function StaffDashboard() {
  const { tickets, updateTicketStatus } = useTickets()
  const [filter, setFilter] = useState('open') // open, in_progress, resolved
  const [selectedTicketId, setSelectedTicketId] = useState(null)

  const filteredTickets = tickets.filter(t => t.status === filter).sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt))
  const selectedTicket = tickets.find(t => t.id === selectedTicketId)

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-md mb-lg z-10 relative">
        <header className="flex flex-col gap-xs">
          <h2 className="text-on-surface font-extrabold flex items-center gap-3" style={{ fontSize: '36px', lineHeight: '1.1' }}>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: '40px' }}>shield_person</span>
            Staff Dashboard
          </h2>
          <p className="text-body-lg text-on-surface-variant max-w-2xl">
            Operations control center. Manage and resolve incoming issues.
          </p>
        </header>

        <div className="flex flex-col items-end gap-md">
          {/* Summary Strip */}
          <div className="flex gap-md w-full md:w-auto">
            <div className="glass-card px-md py-sm rounded-xl flex-1 text-center flex flex-col items-center justify-center">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide mb-1 ${getStatusColor('open')}`}>Open</span>
              <span className="text-xl font-bold text-on-surface leading-none">{tickets.filter(t => t.status === 'open').length}</span>
            </div>
            <div className="glass-card px-md py-sm rounded-xl flex-1 text-center flex flex-col items-center justify-center">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide mb-1 ${getStatusColor('in_progress')}`}>In Progress</span>
              <span className="text-xl font-bold text-on-surface leading-none">{tickets.filter(t => t.status === 'in_progress').length}</span>
            </div>
            <div className="glass-card px-md py-sm rounded-xl flex-1 text-center flex flex-col items-center justify-center">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide mb-1 ${getStatusColor('resolved')}`}>Resolved</span>
              <span className="text-xl font-bold text-on-surface leading-none">{tickets.filter(t => t.status === 'resolved').length}</span>
            </div>
          </div>

          {/* Segmented Filter Buttons */}
          <div className="inline-flex w-full md:w-auto p-1 bg-surface-container-low/60 border border-white/10 rounded-full backdrop-blur-md">
            {['open', 'in_progress', 'resolved'].map(f => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f)
                  setSelectedTicketId(null)
                }}
                className={[
                  'flex-1 md:flex-initial flex items-center justify-center gap-xs px-lg py-sm rounded-full text-label-lg font-bold whitespace-nowrap transition-all duration-300 cursor-pointer',
                  filter === f ? 'bg-primary text-on-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                ].join(' ')}
              >
                {f.replace('_', ' ')}
                <span className={[
                  'ml-2 px-2 py-0.5 text-xs rounded-full font-semibold transition-colors',
                  filter === f ? 'bg-on-primary/20 text-on-primary' : 'bg-white/10 text-on-surface-variant'
                ].join(' ')}>
                  {tickets.filter(t => t.status === f).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-lg min-h-0">
        
        {/* Left Pane: Ticket List */}
        <div className="w-full md:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar border-r border-white/5 md:pr-4">
          {filteredTickets.length === 0 ? (
            <div className="text-on-surface-variant text-center p-xl glass-card rounded-xl">
              <span className="material-symbols-outlined mb-2" style={{ fontSize: '32px' }}>task_alt</span>
              <p>No {filter.replace('_', ' ')} tickets.</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicketId(ticket.id)}
                className={[
                  'glass-card p-md rounded-xl cursor-pointer transition-all border-l-4 shadow-lg hover:shadow-xl',
                  selectedTicketId === ticket.id ? 'border-primary bg-white/10 ring-1 ring-primary' : 'border-transparent hover:bg-white/5'
                ].join(' ')}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={[
                    'text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide',
                    getStatusColor(ticket.status)
                  ].join(' ')}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-on-surface-variant">{formatDate(ticket.reportedAt)}</span>
                </div>
                <h4 className="font-bold text-on-surface truncate">{ticket.description}</h4>
                <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1 truncate">
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_on</span>
                  {ticket.location}
                </p>
                <div className="mt-3 flex gap-2">
                   <span className={[
                     'text-xs font-semibold flex items-center gap-1',
                     getPriorityColor(ticket.priority)
                   ].join(' ')}>
                     <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>flag</span>
                     {ticket.priority.toUpperCase()}
                   </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Pane: Ticket Detail */}
        <div className="w-full md:w-2/3 overflow-y-auto">
          {selectedTicket ? (
            <div className="glass-card rounded-2xl p-xl shadow-2xl border border-white/10 flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
              
              <div className="flex justify-between items-start border-b border-white/10 pb-md mb-md">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-on-surface">{selectedTicket.category.toUpperCase()}</h3>
                    <span className={[
                      'text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm',
                      getStatusColor(selectedTicket.status)
                    ].join(' ')}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-on-surface-variant">Ticket ID: {selectedTicket.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-on-surface-variant">Reported At</p>
                  <p className="font-semibold text-on-surface">{new Date(selectedTicket.reportedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Location</h4>
                  <div className="bg-surface-container p-sm rounded-xl border border-white/5 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>pin_drop</span>
                    <div>
                      <p className="font-bold text-on-surface text-lg">{selectedTicket.location}</p>
                      <p className="text-sm text-on-surface-variant">Zone: {selectedTicket.zone} | Level: {selectedTicket.level}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Fan Description</h4>
                  <div className="bg-surface-container p-md rounded-xl border border-white/5">
                    <p className="text-on-surface text-lg">{selectedTicket.description}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-xl pt-lg border-t border-white/10 flex gap-4">
                {selectedTicket.status === 'open' && (
                  <button 
                    onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                    className="flex-1 bg-warning hover:bg-warning/90 text-on-warning font-bold py-md rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">engineering</span>
                    Mark In Progress
                  </button>
                )}
                
                {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                  <button 
                    onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                    className="flex-1 bg-primary hover:bg-primary/90 text-on-primary font-bold py-md rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Resolve Issue
                  </button>
                )}

                {selectedTicket.status === 'resolved' && (
                  <div className="w-full text-center text-primary font-bold bg-primary-container p-md rounded-xl">
                    <span className="material-symbols-outlined align-middle mr-2">task_alt</span>
                    This issue has been resolved.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-on-surface-variant">
              <div className="text-center">
                <span className="material-symbols-outlined mb-2" style={{ fontSize: '48px', opacity: 0.5 }}>touch_app</span>
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

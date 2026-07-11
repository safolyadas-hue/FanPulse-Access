import React from 'react';

export default function MobileStaffView({
  activeView,
  issues,
  filteredTickets,
  staffFilter,
  setStaffFilter,
  setTicketSheetData
}) {
  const openCount = issues.filter(t => t.status === 'open').length;
  const inProgressCount = issues.filter(t => t.status === 'in_progress').length;
  const resolvedCount = issues.filter(t => t.status === 'resolved').length;

  return (
    <section className={`view ${activeView === 'staff' ? 'active' : ''}`}>
      <div className="view-header">
        <h2>Staff Dashboard</h2>
        <p>Live operations feed — incoming reports and dispatch status.</p>
      </div>

      <div className="card" style={{ padding: '12px 16px', margin: '0 20px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="status-pill open" style={{ display: 'block', marginBottom: '4px' }}>Open</span>
          <strong>{openCount}</strong>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="status-pill in_progress" style={{ display: 'block', marginBottom: '4px' }}>In Progress</span>
          <strong>{inProgressCount}</strong>
        </div>
        <div style={{ textAlign: 'center' }}>
          <span className="status-pill resolved" style={{ display: 'block', marginBottom: '4px' }}>Resolved</span>
          <strong>{resolvedCount}</strong>
        </div>
      </div>

      <div className="staff-filters">
        {['open', 'in_progress', 'resolved'].map(status => (
          <button key={status} className={staffFilter === status ? 'active' : ''} onClick={() => setStaffFilter(status)}>
            {status.replace('_', ' ')} <span className="filter-count">{issues.filter(i => i.status === status).length}</span>
          </button>
        ))}
      </div>

      <div className="ticket-list">
        {filteredTickets.length === 0 ? (
          <div className="empty-state card"><span className="material-symbols-outlined">task_alt</span><p>No {staffFilter.replace('_', ' ')} tickets.</p></div>
        ) : (
          filteredTickets.map(t => (
            <button key={t.id} className={`ticket card ${t.status}`} onClick={() => setTicketSheetData(t)}>
              <div className="ticket-top">
                <span className={`status-pill ${t.status}`}>{t.status.replace('_', ' ')}</span>
                <span className="ticket-time">{t.time || (t.timestamp ? new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}</span>
              </div>
              <h4>{t.desc}</h4>
              <span className="loc"><span className="material-symbols-outlined">location_on</span>{t.location}</span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

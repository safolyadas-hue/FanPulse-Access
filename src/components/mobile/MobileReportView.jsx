import React from 'react';

export default function MobileReportView({
  activeView,
  reportLocation,
  setReportLocation,
  renderLocationOptions,
  reportType,
  setReportType,
  reportDesc,
  setReportDesc,
  handleReportSubmit,
  showToast
}) {
  return (
    <section className={`view ${activeView === 'report' ? 'active' : ''}`}>
      <div className="view-header">
        <h2>Report an Issue</h2>
        <p>Flag accessibility barriers, broken facilities, or hazards in real time.</p>
      </div>

      <form className="report-form card" onSubmit={handleReportSubmit}>
        <div className="field-group">
          <span className="field-label">Location</span>
          <div className="select-row">
            <span className="material-symbols-outlined">pin_drop</span>
            <select value={reportLocation} onChange={e => setReportLocation(e.target.value)} required>
              <option value="" disabled>Select a location...</option>
              {renderLocationOptions()}
            </select>
          </div>
        </div>
        <div className="field-group">
          <span className="field-label">Issue type</span>
          <div className="select-row">
            <span className="material-symbols-outlined" style={{ color: 'var(--color-warning)' }}>warning</span>
            <select value={reportType} onChange={e => setReportType(e.target.value)} required>
              <option>Broken Elevator</option>
              <option>Blocked Ramp</option>
              <option>Medical Emergency</option>
              <option>Cleanliness / Spill</option>
              <option>Safety Concern</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="field-group">
          <span className="field-label">Description</span>
          <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)} placeholder="Please describe the issue..." required></textarea>
        </div>
        <button type="submit" className="submit-btn"><span className="material-symbols-outlined" style={{ fontSize: '19px' }}>send</span> Submit report</button>
      </form>

      {showToast && (
        <div className="toast-success">
          <span className="material-symbols-outlined">check_circle</span>
          <div>
            <strong>Thank you!</strong>
            <p>Your report has been sent to stadium operations.</p>
          </div>
        </div>
      )}
    </section>
  );
}

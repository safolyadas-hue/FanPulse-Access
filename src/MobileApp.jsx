import React, { useState, useEffect, useRef } from 'react';
import './MobileApp.css';
import { useProfile } from './hooks/useProfile.js';
import { useChat } from './hooks/useChat.js';
import { useWayfinding } from './hooks/useWayfinding.js';
import { useIssues } from './hooks/useIssues.js';

const PROFILES = {
  standard: { label: 'Standard', icon: 'check_circle', desc: 'Fast, full-featured experience for every fan.' },
  mobility: { label: 'Mobility', icon: 'accessible', desc: 'Step-free routes, accessible seating & restrooms.' },
  vision: { label: 'Vision', icon: 'visibility', desc: 'Audio-first, high-contrast, landmark-based navigation.' },
  hearing: { label: 'Hearing', icon: 'hearing', desc: 'Visual/text alerts, captions, no audio dependency.' },
  cognitive: { label: 'Cognitive / Sensory', icon: 'psychology', desc: 'Simple language, quiet routes, calm-space focus.' },
};

function getIconForInstruction(instruction = '') {
  const lower = instruction.toLowerCase();
  if (lower.includes('elevator')) return 'elevator';
  if (lower.includes('ramp')) return 'accessible_forward';
  if (lower.includes('stairs')) return 'stairs';
  if (lower.includes('left')) return 'turn_left';
  if (lower.includes('right')) return 'turn_right';
  if (lower.includes('straight')) return 'straight';
  if (lower.includes('arrive') || lower.includes('enter')) return 'flag';
  return 'directions_walk';
}

const PROFILE_NOTES = {
  standard: 'Standard profile — fastest available route.',
  mobility: 'Mobility profile — route adapted to step-free elevators & ramps only.',
  vision: 'Vision profile — high-contrast text and tap-to-hear audio directions enabled.',
  hearing: 'Hearing profile — visual and text-based alerts only, no audio dependency.',
  cognitive: 'Cognitive / Sensory profile — simplified language and quieter route preferred.',
};

export default function MobileApp() {
  const [activeView, setActiveView] = useState('wayfinding');

  // Hooks
  const { profileId, setProfile, uiPreferences } = useProfile();
  const highContrast = uiPreferences?.highContrast || false;
  const { messages, sendMessage, isLoading } = useChat();
  const { currentLocation, setCurrentLocation, destination, setDestination, activeRoute, searchableLocations } = useWayfinding();
  const { issues, addIssue, updateIssue } = useIssues();

  // State
  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
  const [ticketSheetData, setTicketSheetData] = useState(null);

  // Chat
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef(null);

  // Report
  const [reportLocation, setReportLocation] = useState('');
  const [reportType, setReportType] = useState('Broken Elevator');
  const [reportDesc, setReportDesc] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Staff
  const [staffFilter, setStaffFilter] = useState('open');

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speakStep = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    const loc = searchableLocations.find(l => l.id === reportLocation);
    addIssue({
      type: reportType,
      location: loc ? loc.name : reportLocation,
      zone: 'Unknown',
      level: 'Unknown',
      desc: reportDesc,
      priority: 'medium'
    });
    setReportDesc('');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  // Group locations for selects
  const groupedLocations = searchableLocations.reduce((acc, loc) => {
    if (!acc[loc.type]) acc[loc.type] = [];
    acc[loc.type].push(loc);
    return acc;
  }, {});

  const renderLocationOptions = () => {
    return Object.entries(groupedLocations).map(([type, locs]) => (
      <optgroup key={type} label={type + 's'}>
        {locs.map(l => (
          <option key={l.id} value={l.id}>{l.name}</option>
        ))}
      </optgroup>
    ));
  };

  const filteredTickets = issues.filter(t => t.status === staffFilter);

  return (
    <div className={`mobile-app ${highContrast ? 'high-contrast' : ''}`}>
      <div id="app">

        {/* ── TOP BAR ── */}
        <header className="topbar">
          <div className="brand">
            <div className="mark"><span className="material-symbols-outlined" style={{ fontSize: '19px' }}>stadium</span></div>
            <h1>FanPulse Access</h1>
          </div>
          <button className="profile-chip" onClick={() => setIsProfileSheetOpen(true)} aria-haspopup="true">
            <span className="avatar"><span className="material-symbols-outlined">{PROFILES[profileId]?.icon || 'person'}</span></span>
            <span className="label">{PROFILES[profileId]?.label || 'Standard'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-on-surface-variant)' }}>expand_more</span>
          </button>
        </header>

        <main className={activeView === 'chat' ? 'chat-active' : ''}>
          {/* ── WAYFINDING ── */}
          <section className={`view ${activeView === 'wayfinding' ? 'active' : ''}`}>
            <div className="view-header">
              <h2>Wayfinding</h2>
              <p>Step-by-step, profile-adapted directions to any stadium location.</p>
            </div>

            <div style={{ margin: '16px 20px 0' }} className="card">
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="field-group">
                  <span className="field-label">Starting point</span>
                  <div className="select-row">
                    <span className="material-symbols-outlined">my_location</span>
                    <select value={currentLocation} onChange={e => setCurrentLocation(e.target.value)}>
                      <option value="" disabled>Select start...</option>
                      {renderLocationOptions()}
                    </select>
                  </div>
                </div>
                <div className="field-group">
                  <span className="field-label">Destination</span>
                  <div className="select-row">
                    <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>location_on</span>
                    <select value={destination || ''} onChange={e => setDestination(e.target.value)}>
                      <option value="" disabled>Select destination...</option>
                      {renderLocationOptions()}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {activeRoute && (
              <>
                <div className="route-summary card">
                  <h3><span className="material-symbols-outlined" style={{ color: 'var(--color-primary)', fontSize: '19px' }}>route</span> Route summary</h3>
                  <div className="route-stats">
                    <div className="route-stat"><div className="num">{activeRoute.totalDistance}</div><div className="lbl">Distance</div></div>
                    <div className="route-stat"><div className="num">{activeRoute.estimatedMinutes} <span style={{ fontSize: '12px', fontWeight: '600' }}>min</span></div><div className="lbl">Est. time</div></div>
                  </div>
                  <div className="profile-note">
                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>info</span>
                    <span>{PROFILE_NOTES[profileId]}</span>
                  </div>
                </div>

                <div className="steps card">
                  <h3>Step-by-step guide</h3>
                  <div>
                    {activeRoute.steps.map((step, idx) => {
                      const icon = getIconForInstruction(step.instruction);
                      return (
                        <div key={idx} className="step">
                          <div className="step-dot"><span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{icon}</span></div>
                          <div className="step-body">
                            <h4>{step.instruction}</h4>
                            <p><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>straighten</span> {step.distance} m{step.stepFree ? ' • Step-free' : ''}</p>
                          </div>
                          {profileId === 'vision' && (
                            <div className="step-audio" onClick={() => speakStep(step.instruction)}>
                              <span className="material-symbols-outlined">volume_up</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </section>

          {/* ── CHAT ── */}
          <section className={`view chat-view ${activeView === 'chat' ? 'active' : ''}`} style={{ display: activeView === 'chat' ? 'flex' : 'none' }}>
            <div className="chat-banner">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock</span>
              <span>Messages are processed by AI to help you. No personal data is stored beyond the session.</span>
            </div>
            <div className="chat-scroll" ref={chatScrollRef}>
              <span className="date-badge">{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              {messages.map((msg, i) => (
                <div key={i} className={`msg-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
                  <div className="msg-avatar"><span className="material-symbols-outlined">{msg.role === 'user' ? 'person' : 'support_agent'}</span></div>
                  <div className="bubble">
                    {msg.text}
                    <time>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                  </div>
                </div>
              ))}
            </div>
            <form className="chat-input-bar" onSubmit={handleChatSubmit}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message or request..." autoComplete="off" />
              <button type="submit" className="send-btn" disabled={isLoading || !chatInput.trim()}><span className="material-symbols-outlined">send</span></button>
            </form>
          </section>

          {/* ── REPORT ── */}
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

          {/* ── STAFF ── */}
          <section className={`view ${activeView === 'staff' ? 'active' : ''}`}>
            <div className="view-header">
              <h2>Staff Dashboard</h2>
              <p>Live operations feed — incoming reports and dispatch status.</p>
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
                      <span className="ticket-time">{t.time || new Date(t.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h4>{t.desc}</h4>
                    <span className="loc"><span className="material-symbols-outlined">location_on</span>{t.location}</span>
                  </button>
                ))
              )}
            </div>
          </section>
        </main>

        {/* ── BOTTOM TAB BAR ── */}
        <nav className="tabbar">
          <button className={activeView === 'wayfinding' ? 'active' : ''} onClick={() => setActiveView('wayfinding')}><span className="material-symbols-outlined">map</span><span className="tab-label">Wayfinding</span></button>
          <button className={activeView === 'chat' ? 'active' : ''} onClick={() => setActiveView('chat')}><span className="material-symbols-outlined">chat</span><span className="tab-label">Chat</span></button>
          <button className={activeView === 'report' ? 'active' : ''} onClick={() => setActiveView('report')}><span className="material-symbols-outlined">report_problem</span><span className="tab-label">Report</span></button>
          <button className={activeView === 'staff' ? 'active' : ''} onClick={() => setActiveView('staff')}><span className="material-symbols-outlined">shield</span><span className="tab-label">Staff</span></button>
        </nav>

        {/* ── TICKET DETAIL SHEET ── */}
        <div className={`sheet-backdrop ${ticketSheetData ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setTicketSheetData(null); }}>
          {ticketSheetData && (
            <div className="sheet">
              <button className="close-sheet" onClick={() => setTicketSheetData(null)}><span className="material-symbols-outlined">close</span></button>
              <div className="sheet-handle"></div>
              <h3>{ticketSheetData.type}</h3>
              <div className="ticket-id">Ticket ID: {ticketSheetData.id}</div>
              <div className="detail-block">
                <h5>Location</h5>
                <div className="box"><strong>{ticketSheetData.location}</strong><br /><span style={{ color: 'var(--color-on-surface-variant)', fontSize: '12.5px' }}>Zone: {ticketSheetData.zone} · Level: {ticketSheetData.level}</span></div>
              </div>
              <div className="detail-block">
                <h5>Fan description</h5>
                <div className="box">{ticketSheetData.desc}</div>
              </div>

              {ticketSheetData.status !== 'resolved' ? (
                <div className="sheet-actions">
                  {ticketSheetData.status === 'open' && (
                    <button className="btn-progress" onClick={() => { updateIssue(ticketSheetData.id, { status: 'in_progress' }); setTicketSheetData(null); }}><span className="material-symbols-outlined" style={{ fontSize: '17px' }}>engineering</span> Mark in progress</button>
                  )}
                  <button className="btn-resolve" onClick={() => { updateIssue(ticketSheetData.id, { status: 'resolved' }); setTicketSheetData(null); }}><span className="material-symbols-outlined" style={{ fontSize: '17px' }}>check_circle</span> Resolve</button>
                </div>
              ) : (
                <div className="box" style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: '700', marginTop: '16px' }}>Resolved</div>
              )}
            </div>
          )}
        </div>

        {/* ── PROFILE SWITCHER SHEET ── */}
        <div className={`sheet-backdrop ${isProfileSheetOpen ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setIsProfileSheetOpen(false); }}>
          <div className="sheet">
            <div className="sheet-handle"></div>
            <h3 style={{ marginBottom: '2px' }}>Accessibility profile</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--color-on-surface-variant)', margin: '0 0 14px' }}>Adapts routing, chat, and alerts to your needs.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(PROFILES).map(([id, p]) => (
                <button key={id} className={`profile-option ${id === profileId ? 'active' : ''}`} onClick={() => { setProfile(id); setIsProfileSheetOpen(false); }}>
                  <span className="icon"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{p.icon}</span></span>
                  <span className="txt"><strong>{p.label}</strong><span>{p.desc}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

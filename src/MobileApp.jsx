import React, { useState, useEffect, useRef } from 'react';
import './MobileApp.css';
import { useProfile } from './hooks/useProfile.js';
import { useChat } from './hooks/useChat.js';
import { useWayfinding } from './hooks/useWayfinding.js';
import { useIssues } from './hooks/useIssues.js';
import { ISSUE_STATUS } from './constants/issueStatus.js';
import MobileWayfindingView from './components/mobile/MobileWayfindingView.jsx';
import MobileChatView from './components/mobile/MobileChatView.jsx';
import MobileReportView from './components/mobile/MobileReportView.jsx';
import MobileStaffView from './components/mobile/MobileStaffView.jsx';
import { getProfile } from './services/profileEngine.js';

const PROFILE_ICONS = {
  standard: 'check_circle',
  mobility: 'accessible',
  vision: 'visibility',
  hearing: 'hearing',
  cognitive: 'psychology',
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
  const [staffFilter, setStaffFilter] = useState(ISSUE_STATUS.OPEN);

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
            <span className="avatar"><span className="material-symbols-outlined">{PROFILE_ICONS[profileId] || 'person'}</span></span>
            <span className="label">{getProfile(profileId)?.label || 'Standard'}</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-on-surface-variant)' }}>expand_more</span>
          </button>
        </header>

        <main className={activeView === 'chat' ? 'chat-active' : ''}>
          <MobileWayfindingView
            activeView={activeView}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
            destination={destination}
            setDestination={setDestination}
            renderLocationOptions={renderLocationOptions}
            activeRoute={activeRoute}
            profileId={profileId}
            speakStep={speakStep}
          />

          <MobileChatView
            activeView={activeView}
            chatScrollRef={chatScrollRef}
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleChatSubmit={handleChatSubmit}
            isLoading={isLoading}
          />

          <MobileReportView
            activeView={activeView}
            reportLocation={reportLocation}
            setReportLocation={setReportLocation}
            renderLocationOptions={renderLocationOptions}
            reportType={reportType}
            setReportType={setReportType}
            reportDesc={reportDesc}
            setReportDesc={setReportDesc}
            handleReportSubmit={handleReportSubmit}
            showToast={showToast}
          />

          <MobileStaffView
            activeView={activeView}
            issues={issues}
            filteredTickets={filteredTickets}
            staffFilter={staffFilter}
            setStaffFilter={setStaffFilter}
            setTicketSheetData={setTicketSheetData}
          />
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

              {ticketSheetData.status !== ISSUE_STATUS.RESOLVED ? (
                <div className="sheet-actions">
                  {ticketSheetData.status === ISSUE_STATUS.OPEN && (
                    <button className="btn-progress" onClick={() => { updateIssue(ticketSheetData.id, { status: ISSUE_STATUS.IN_PROGRESS }); setTicketSheetData(null); }}><span className="material-symbols-outlined" style={{ fontSize: '17px' }}>engineering</span> Mark in progress</button>
                  )}
                  <button className="btn-resolve" onClick={() => { updateIssue(ticketSheetData.id, { status: ISSUE_STATUS.RESOLVED }); setTicketSheetData(null); }}><span className="material-symbols-outlined" style={{ fontSize: '17px' }}>check_circle</span> Resolve</button>
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
              {Object.keys(PROFILE_ICONS).map(id => (
                <button key={id} className={`profile-option ${id === profileId ? 'active' : ''}`} onClick={() => { setProfile(id); setIsProfileSheetOpen(false); }}>
                  <span className="icon"><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{PROFILE_ICONS[id]}</span></span>
                  <span className="txt"><strong>{getProfile(id)?.label}</strong><span>{getProfile(id)?.description}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

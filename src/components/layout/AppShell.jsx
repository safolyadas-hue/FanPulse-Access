/**
 * AppShell.jsx — Main Layout Wrapper
 *
 * Converted from the Google AI Studio desktop + mobile HTML prototypes into
 * a single, fully responsive React layout. Combines:
 *   - Desktop: sidebar navigation (hidden md:flex)
 *   - Mobile: bottom tab bar (md:hidden)
 *   - Shared: sticky top navbar with ProfileSwitcher
 *
 * The main content area renders {children} so each view can be injected
 * dynamically. The top-level container reads from useProfile() to apply
 * global accessibility overrides (highContrast, largeText, reduceMotion).
 */

import { useState } from 'react'
import { useProfile } from '../../hooks/useProfile.js'
import ProfileSwitcher from './ProfileSwitcher.jsx'
import ChatPanel from '../chat/ChatPanel.jsx'
import WayfindingPanel from '../wayfinding/WayfindingPanel.jsx'
import IssueReporter from '../operations/IssueReporter.jsx'
import StaffDashboard from '../operations/StaffDashboard.jsx'

// ─── Navigation Items ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'wayfinding', label: 'Wayfinding',    icon: 'explore',        iconMobile: 'map'            },
  { id: 'chat',       label: 'Chat',          icon: 'chat',           iconMobile: 'chat'           },
  { id: 'report',     label: 'Report Issue',  icon: 'report',         iconMobile: 'report_problem' },
  { id: 'staff',      label: 'Staff View',    icon: 'badge',          iconMobile: 'shield'         },
]

// ─── Placeholder Panels ───────────────────────────────────────────────────────

function PlaceholderPanel({ title, description }) {
  return (
    <div className="flex-1 flex flex-col gap-xl">
      {/* Header */}
      <header className="flex flex-col gap-xs z-10 relative">
        <h2 className="text-display-lg text-on-surface font-extrabold" style={{ fontSize: '36px', lineHeight: '1.1' }}>
          {title}
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          {description}
        </p>
      </header>

      {/* Placeholder content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="glass-card rounded-xl p-xl text-center max-w-md">
          <div className="w-16 h-16 rounded-xl glass-card flex items-center justify-center text-primary mx-auto mb-md">
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>construction</span>
          </div>
          <h3 className="text-headline-md text-on-surface font-semibold mb-xs" style={{ fontSize: '20px' }}>
            Coming Next
          </h3>
          <p className="text-on-surface-variant text-sm">
            This module will be built in the next phase of development.
          </p>
        </div>
      </div>
    </div>
  )
}

const VIEW_CONFIG = {
  wayfinding: { title: 'Wayfinding',       description: 'Step-by-step adaptive navigation to any seat, facility, or service point in the stadium.' },
  chat:       { title: 'Chat Assistance',  description: 'Connect with venue staff or automated assistants for real-time support, directions, and accessibility services.' },
  report:     { title: 'Report an Issue',  description: 'Flag accessibility barriers, broken facilities, or safety concerns in real time.' },
  staff:      { title: 'Staff Dashboard',  description: 'Live operations feed for venue staff — incoming reports, dispatch status, and facility health.' },
}

// ─── AppShell Component ───────────────────────────────────────────────────────

export default function AppShell() {
  const { profileId, uiPreferences } = useProfile()
  const { highContrast, largeText, reduceMotion } = uiPreferences
  const [activeView, setActiveView] = useState('chat')

  // ── Global container classes driven by active profile ──
  const containerClasses = [
    'bg-background text-on-surface font-sans h-screen w-screen flex overflow-hidden',
    highContrast ? 'high-contrast' : '',
    largeText ? 'text-lg' : '',
    reduceMotion ? 'reduce-motion' : '',
  ].filter(Boolean).join(' ')

  const viewConfig = VIEW_CONFIG[activeView] || VIEW_CONFIG.chat

  return (
    <div className={containerClasses}>
      {/* ── Skip Link ── */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ══════════════════════════════════════════════════════════════
          TOP NAVBAR (shared between desktop and mobile)
          ══════════════════════════════════════════════════════════════ */}
      {activeView !== 'chat' && (
        <nav
          className={[
            'fixed top-0 w-full z-50 flex justify-between items-center h-16 px-lg',
            'bg-surface/70 backdrop-blur-xl border-b border-white/10',
            'shadow-[0_10px_30px_rgba(6,182,212,0.1)]',
          ].join(' ')}
          role="banner"
        >
          {/* Logo */}
          <div className="flex items-center gap-md">
            {/* Mobile menu button (placeholder) */}
            <button
              className="w-touch-target h-touch-target flex items-center justify-center text-primary hover:bg-white/10 transition-colors active:scale-95 rounded-full md:hidden cursor-pointer"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1
              className="font-extrabold text-primary tracking-tighter"
              style={{ fontSize: '28px', lineHeight: '1.1' }}
            >
              FanPulse Access
            </h1>
          </div>

          {/* Desktop: spacer for center alignment */}
          <div className="hidden md:flex flex-1 justify-center" />
        </nav>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BODY — sidebar (desktop) + main content
          ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden w-full">

        {/* ── Desktop Sidebar ── */}
        <aside className={['h-full w-64 hidden md:flex flex-col bg-surface-container-low/70 backdrop-blur-2xl border-r border-white/10 z-40 pb-md relative shrink-0', activeView === 'chat' ? 'pt-lg' : 'pt-20'].join(' ')}>
          {/* Sidebar header */}
          <div className="px-lg pb-xl border-b border-white/10 mb-md flex flex-col gap-sm">
            <div className="w-12 h-12 rounded-lg glass-card flex items-center justify-center text-primary mb-xs">
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>stadium</span>
            </div>
            <div>
              <h2 className="text-primary font-semibold" style={{ fontSize: '20px' }}>
                FanPulse Access
              </h2>
              <p className="text-on-surface-variant text-sm">
                Stadium Assistant
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 flex flex-col gap-base px-sm">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === activeView
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={[
                    'flex items-center gap-md px-md py-sm rounded-lg cursor-pointer',
                    'transition-all duration-300 ease-in-out min-h-[44px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive
                      ? 'text-primary bg-primary/10 border-r-4 border-primary'
                      : 'text-on-surface-variant hover:bg-white/5 hover:text-on-surface group',
                  ].join(' ')}
                  role="tab"
                  aria-selected={isActive}
                >
                  <span
                    className={[
                      'material-symbols-outlined text-xl',
                      isActive ? '' : 'group-hover:text-primary transition-colors',
                    ].join(' ')}
                  >
                    {item.icon}
                  </span>
                  <span className="font-semibold text-label-lg">
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Emergency and Profile */}
          <div className="px-md mt-auto pt-md border-t border-white/10 flex flex-col gap-sm">
            <div className="w-full">
              <ProfileSwitcher />
            </div>
            <button className="w-full flex items-center justify-center gap-sm bg-primary/20 text-primary border border-primary/50 hover:bg-primary hover:text-on-primary transition-colors rounded-lg py-sm font-semibold min-h-[44px] cursor-pointer">
              <span className="material-symbols-outlined text-lg">emergency</span>
              Emergency Support
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main
          id="main-content"
          className={['flex-1 h-full flex flex-col min-h-0 bg-surface relative', activeView === 'chat' ? '' : 'pt-16 overflow-y-auto pb-20 md:pb-0'].join(' ')}
          role="main"
          aria-label={`${viewConfig.title} view`}
        >
          {/* Ambient glow */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 40%)' }}
          />

          <div className={['mx-auto h-full flex flex-col relative z-10 w-full', activeView === 'chat' ? '' : 'max-w-7xl p-lg md:p-xl gap-xl'].join(' ')}>
            {activeView === 'chat' ? (
              <ChatPanel />
            ) : activeView === 'wayfinding' ? (
              <WayfindingPanel />
            ) : activeView === 'report' ? (
              <IssueReporter />
            ) : activeView === 'staff' ? (
              <StaffDashboard />
            ) : (
              <PlaceholderPanel
                title={viewConfig.title}
                description={viewConfig.description}
              />
            )}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MOBILE BOTTOM TAB BAR (md:hidden)
          ══════════════════════════════════════════════════════════════ */}
      <nav
        className={[
          'fixed bottom-0 w-full z-50 md:hidden',
          'bg-surface-container-low/70 backdrop-blur-xl border-t border-white/10',
          'flex justify-around items-center h-20 pb-xs px-container-padding',
        ].join(' ')}
        role="tablist"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeView
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={[
                'flex flex-col items-center justify-center cursor-pointer',
                'min-w-[64px] transition-all active:scale-90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isActive
                  ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1.5 h-[56px]'
                  : 'text-on-surface-variant hover:text-primary h-touch-target',
              ].join(' ')}
              role="tab"
              aria-selected={isActive}
            >
              <span className="material-symbols-outlined mb-1">
                {item.iconMobile}
              </span>
              <span className="font-semibold text-label-lg">
                {item.label === 'Report Issue' ? 'Report' : item.label === 'Staff View' ? 'Staff' : item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

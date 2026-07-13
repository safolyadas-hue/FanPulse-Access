/**
 * ProfileSwitcher.jsx — Accessibility Profile Selector
 *
 * Converted from the Google AI Studio HTML prototype into a React component.
 * Uses Material Symbols icons, maps over profileEngine.js definitions,
 * and wires active state through the useProfile() hook.
 */

import { useState, useRef, useEffect } from 'react'
import { useProfile } from '../../hooks/useProfile.js'
import { PROFILES, PROFILE_IDS } from '../../services/profileEngine.js'

/**
 * Maps profileEngine IDs to Material Symbols icon names
 * (matching the icons used in the HTML prototype).
 */
const PROFILE_ICONS = {
  standard: 'check_circle',
  mobility: 'accessible',
  vision: 'visibility',
  hearing: 'hearing',
  cognitive: 'psychology',
}

export default function ProfileSwitcher({ position = 'up' }) {
  const { profileId, setProfile } = useProfile()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const triggerRef = useRef(null)

  // ── Close on outside click or Escape ──
  useEffect(() => {
    if (!isOpen) return

    function handleOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const selectProfile = (id) => {
    setProfile(id)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const currentProfile = PROFILES[profileId] || PROFILES['standard']

  return (
    <div className="flex items-center gap-md relative" ref={containerRef}>
      {/* ── Trigger Button ── */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={[
          'flex items-center gap-sm text-on-surface hover:text-primary',
          'transition-colors active:scale-95 duration-200 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        ].join(' ')}
        aria-label={`Current profile: ${currentProfile.label}. Click to change.`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        id="profileBtn"
      >
        {/* Avatar circle with profile icon */}
        <div className="w-8 h-8 rounded-full border border-white/5 bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>
            {PROFILE_ICONS[profileId] || 'person'}
          </span>
        </div>
        <span className="font-semibold hidden md:block text-action-lg">Profile</span>
        <span className="material-symbols-outlined">expand_more</span>
      </button>

      {/* ── Dropdown Menu ── */}
      {isOpen && (
        <div
          className={[
            'absolute w-80 bg-surface-container-high border border-white/5 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 flex flex-col p-sm gap-xs',
            position === 'down' ? 'top-full right-0 mt-2 origin-top-right' : 'bottom-full left-0 mb-2 origin-bottom-left'
          ].join(' ')}
          role="menu"
          aria-label="Select your access profile"
        >
          {/* Header */}
          <div className="px-sm py-xs text-on-surface-variant font-semibold text-label-lg uppercase tracking-widest border-b border-white/5 mb-xs pb-sm">
            Accessibility Modes
          </div>

          {/* Profile Options — mapped from profileEngine.js */}
          <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-xs scrollbar-thin">
            {PROFILE_IDS.map((id) => {
              const profile = PROFILES[id]
              const isActive = id === profileId
              const iconName = PROFILE_ICONS[id]

              return (
                <button
                  key={id}
                  onClick={() => selectProfile(id)}
                  className={[
                    'w-full flex items-start gap-md p-sm rounded-lg text-left cursor-pointer',
                    'transition-colors duration-200 group',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive
                      ? 'bg-primary/10 border border-primary hover:bg-primary/20'
                      : 'border border-transparent hover:bg-white/5',
                  ].join(' ')}
                  role="menuitemradio"
                  aria-checked={isActive}
                  aria-label={`${profile.label}: ${profile.description}`}
                >
                  {/* Icon */}
                  <span
                    className={[
                      'material-symbols-outlined mt-1 transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-on-surface-variant group-hover:text-primary',
                    ].join(' ')}
                  >
                    {isActive ? 'check_circle' : iconName}
                  </span>

                  {/* Text */}
                  <div className="flex flex-col flex-1">
                    <span
                      className={[
                        'font-semibold',
                        isActive
                          ? 'text-primary'
                          : 'text-on-surface group-hover:text-primary transition-colors',
                      ].join(' ')}
                      style={{ fontSize: '18px' }}
                    >
                      {profile.label}
                    </span>
                    <span className="text-on-surface-variant text-sm">
                      {profile.description}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
